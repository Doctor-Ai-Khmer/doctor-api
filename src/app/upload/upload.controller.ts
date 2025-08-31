import { Controller, Post, UploadedFile, UseInterceptors, Body, BadRequestException, UseGuards, Get, Param, Req, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Express } from 'express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes

const fileFilter = (req: any, file: Express.Multer.File, callback: any) => {
  // Check file type
  if (!file.mimetype.match(/^image\/(png|jpeg|jpg|gif)$/)) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return callback(new BadRequestException('File size exceeds 4MB limit. Please compress your image.'), false);
  }

  callback(null, true);
};

const multerOptions: MulterOptions = {
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
};

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Body('description') description?: string,
  ) {
    return this.uploadService.uploadFile(file, description, req.user.userId);
  }

  @Get('status/:id')
  async getAnalysisStatus(@Param('id') id: number) {
    const image = await this.uploadService.findOne(id);
    return {
      id: image.id,
      status: image.analysis === 'Processing...' ? 'processing' : 'completed',
      analysis: image.analysis,
    };
  }

  @Get('remaining')
  async getRemainingUploads(@Req() req: any) {
    return this.uploadService.getRemainingUploads(req.user.userId);
  }

  @Get('analyses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllAnalyses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: number,
    @Query('status') status?: 'processing' | 'completed'
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId,
      status
    };

    const pagination = {
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 10,
      sortBy,
      sortOrder
    };

    const result = await this.uploadService.getAllAnalyses(filters, pagination);

    return {
      data: result.data.map(analysis => ({
        id: analysis.id,
        imageUrl: analysis.url,
        description: analysis.description,
        analysis: analysis.analysis,
        status: analysis.analysis === 'Processing...' ? 'processing' : 'completed',
        user: analysis.user ? {
          id: analysis.user.id,
          name: analysis.user.fullName,
          email: analysis.user.email,
          role: analysis.user.role
        } : null,
        createdAt: analysis.createdAt
      })),
      pagination: result.pagination
    };
  }
} 