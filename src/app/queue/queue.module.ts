import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageAnalysisProcessor } from './image-analysis.processor';
import { GeminiModule } from '../gemini/gemini.module';
import { Image } from '../../database/entities/image.entity';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'imageAnalysis',
    }),
    TypeOrmModule.forFeature([Image]),
    GeminiModule,
  ],
  providers: [ImageAnalysisProcessor],
  exports: [BullModule],
})
export class QueueModule {} 