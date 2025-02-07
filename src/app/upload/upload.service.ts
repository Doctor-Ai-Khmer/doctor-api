import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { storage } from '../../config/firebase.config';
import { Image } from '../../database/entities/image.entity';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as sharp from 'sharp';
import { GeminiService } from '../gemini/gemini.service';
import { User } from '../../database/entities/user.entity';

interface AnalysisFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  status?: 'processing' | 'completed';
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class UploadService {
  private readonly FREE_UPLOAD_LIMIT = 2;

  constructor(
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectQueue('imageAnalysis')
    private imageAnalysisQueue: Queue,
    private geminiService: GeminiService,
  ) {}

  async uploadFile(file: Express.Multer.File, description: string, userId: number): Promise<Image> {
    // Check user's upload limit
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Admins and premium users have unlimited uploads
    if (user.role !== 'admin' && !user.isPremium && user.uploadCount >= this.FREE_UPLOAD_LIMIT) {
      throw new BadRequestException(
        'You have reached your free upload limit. Please upgrade to premium for unlimited uploads.'
      );
    }

    // Proceed with upload
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Compress image
      const compressedImageBuffer = await this.compressImage(file.buffer);
      
      // Upload to Firebase
      const fileUrl = await this.uploadToFirebase({
        ...file,
        buffer: compressedImageBuffer
      });
      
      // Create image record with initial analysis status
      const image = this.imageRepository.create({
        url: fileUrl,
        description,
        analysis: 'Processing...',
        user
      });
      await this.imageRepository.save(image);

      // Increment upload count for non-admin, non-premium users
      if (user.role !== 'admin' && !user.isPremium) {
        user.uploadCount++;
        await this.userRepository.save(user);
      }

      // Add to queue for processing
      await this.imageAnalysisQueue.add('analyze', {
        imageId: image.id,
        imageBuffer: compressedImageBuffer,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      try {
        // Try immediate analysis but don't block the response
        const analysisResult = await this.geminiService.analyzeImage(compressedImageBuffer);
        if (analysisResult) {
          image.analysis = analysisResult;
          await this.imageRepository.save(image);
        }
      } catch (analysisError) {
        // Log the error but don't fail the upload
        console.warn('Initial analysis failed, will retry in queue:', analysisError.message);
      }

      return image;
    } catch (error) {
      throw new BadRequestException(`Failed to process upload: ${error.message}`);
    }
  }

  private async compressImage(buffer: Buffer): Promise<Buffer> {
    try {
      const compressedImageBuffer = await sharp(buffer)
        .resize(800, 800, {
          fit: 'inside',        // Maintain aspect ratio
          withoutEnlargement: true  // Don't enlarge if image is smaller
        })
        .jpeg({
          quality: 70,          // Reduce quality to 70%
          progressive: true,    // Enable progressive loading
          chromaSubsampling: '4:2:0'  // Further reduce file size
        })
        .toBuffer();

      return compressedImageBuffer;
    } catch (error) {
      throw new BadRequestException('Failed to compress image: ' + error.message);
    }
  }

  private async uploadToFirebase(file: Express.Multer.File): Promise<string> {
    try {
      if (!file.originalname || !file.buffer) {
        throw new BadRequestException('Invalid file');
      }

      const fileName = `${uuidv4()}-${file.originalname.replace(/\.[^/.]+$/, '')}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // Set metadata with correct content type for JPEG
      const metadata = {
        contentType: 'image/jpeg',
        contentDisposition: 'inline',
      };

      // Upload compressed buffer with metadata
      await uploadBytes(storageRef, file.buffer, metadata);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw new BadRequestException('Failed to upload file: ' + error.message);
    }
  }

  async findOne(id: number): Promise<Image> {
    const image = await this.imageRepository.findOne({
      where: { id }
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    return image;
  }

  // Add method to check remaining uploads
  async getRemainingUploads(userId: number): Promise<{ 
    remaining: number;
    total: number;
    isPremium: boolean;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role === 'admin' || user.isPremium) {
      return {
        remaining: Infinity,
        total: Infinity,
        isPremium: true
      };
    }

    return {
      remaining: Math.max(0, this.FREE_UPLOAD_LIMIT - user.uploadCount),
      total: this.FREE_UPLOAD_LIMIT,
      isPremium: false
    };
  }

  async getAllAnalyses(
    filters?: AnalysisFilters,
    pagination?: PaginationOptions
  ) {
    const query = this.imageRepository.createQueryBuilder('image')
      .leftJoinAndSelect('image.user', 'user')
      .select([
        'image.id',
        'image.url',
        'image.description',
        'image.analysis',
        'image.createdAt',
        'user.id',
        'user.fullName',
        'user.email',
        'user.role'
      ]);

    // Apply filters
    if (filters) {
      if (filters.startDate) {
        query.andWhere('image.createdAt >= :startDate', { startDate: filters.startDate });
      }
      if (filters.endDate) {
        query.andWhere('image.createdAt <= :endDate', { endDate: filters.endDate });
      }
      if (filters.userId) {
        query.andWhere('user.id = :userId', { userId: filters.userId });
      }
      if (filters.status) {
        if (filters.status === 'processing') {
          query.andWhere('image.analysis = :analysis', { analysis: 'Processing...' });
        } else {
          query.andWhere('image.analysis != :analysis', { analysis: 'Processing...' });
        }
      }
    }

    // Apply sorting
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'DESC';
    query.orderBy(`image.${sortBy}`, sortOrder);

    // Apply pagination
    if (pagination) {
      const skip = (pagination.page - 1) * pagination.limit;
      query.skip(skip).take(pagination.limit);
    }

    // Get total count for pagination
    const [analyses, total] = await query.getManyAndCount();

    return {
      data: analyses,
      pagination: pagination ? {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      } : null
    };
  }
} 