import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckController } from './health-check.controller';
import { HealthCheckService } from './health-check.service';
import { HealthCheck } from '../../database/entities/health-check.entity';
import { Question } from '../../database/entities/question.entity';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthCheck, Question]),
    GeminiModule,
  ],
  controllers: [HealthCheckController],
  providers: [HealthCheckService],
})
export class HealthCheckModule {} 