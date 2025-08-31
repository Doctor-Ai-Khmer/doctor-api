import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from '../database/db.config';
import { UploadModule } from './upload/upload.module';
import { GeminiModule } from './gemini/gemini.module';
import { Image } from '../database/entities/image.entity';
import { User } from '../database/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { HealthCheck } from '../database/entities/health-check.entity';
import { Question } from '../database/entities/question.entity';
import { Category } from '../database/entities/category.entity';
import { Article } from '../database/entities/article.entity';
import { AuthMiddleware } from './auth/auth.middleware';
import { JwtModule } from '@nestjs/jwt';
import { ArticleModule } from './article/article.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [Image, User, HealthCheck, Question, Category, Article],
    }),
    UploadModule,
    GeminiModule,
    AuthModule,
    HealthCheckModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION_TIME },
    }),
    ArticleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*');  // Apply to all routes
  }
}

