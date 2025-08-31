import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { GeminiService } from '../gemini/gemini.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '../../database/entities/image.entity';

@Processor('imageAnalysis')
export class ImageAnalysisProcessor {
  constructor(
    private geminiService: GeminiService,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  @Process('analyze')
  async handleImageAnalysis(job: Job) {
    const { imageId, imageBuffer } = job.data;
    
    try {
      // Convert base64 string back to Buffer
      const buffer = Buffer.from(imageBuffer, 'base64');
      
      // Get AI analysis
      const analysis = await this.geminiService.analyzeImage(buffer);
      
      // Update image record with analysis
      await this.imageRepository.update(imageId, { analysis });
      
      return analysis;
    } catch (error) {
      console.error(`Failed to process image ${imageId}:`, error);
      throw error;
    }
  }
} 