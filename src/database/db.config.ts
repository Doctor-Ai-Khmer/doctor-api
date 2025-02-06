import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { User } from '../database/entities/user.entity';
import { Image } from '../database/entities/image.entity';
import { HealthCheck } from '../database/entities/health-check.entity';
import { Question } from '../database/entities/question.entity';
import { Category } from '../database/entities/category.entity';
import { Article } from '../database/entities/article.entity';

dotenv.config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Image, HealthCheck, Question, Category, Article],
  synchronize: process.env.DB_SYNC === 'true',
  logging: true,
  retryAttempts: 5,
  retryDelay: 3000,
  dropSchema: true,
};
