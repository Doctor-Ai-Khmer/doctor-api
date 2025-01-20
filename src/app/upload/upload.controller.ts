import { Controller, Post, UploadedFile, UseInterceptors, Body, BadRequestException, UseGuards, Get, Param, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Express } from 'express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
} 