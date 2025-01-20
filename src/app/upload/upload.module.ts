import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bull';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Image } from '../../database/entities/image.entity';
import { User } from '../../database/entities/user.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Image, User]),
    GeminiModule,
    PassportModule,
    QueueModule,
    BullModule.registerQueue({
      name: 'imageAnalysis',
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {} 