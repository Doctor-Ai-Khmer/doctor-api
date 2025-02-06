import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { HealthCheckService } from './health-check.service';

@Controller('health-check')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthCheckController {
  constructor(private healthCheckService: HealthCheckService) {}

  // Category endpoints
  @Post('categories')
  @Roles(UserRole.ADMIN)
  createCategory(@Body() data: { name: string; description?: string }) {
    return this.healthCheckService.createCategory(data);
  }

  @Get('categories')
  @Roles(UserRole.ADMIN, UserRole.USER)
  getAllCategories() {
    return this.healthCheckService.getAllCategories();
  }

  @Get('categories/list')
  @Roles(UserRole.ADMIN, UserRole.USER)
  getAllCategoriesWithoutQuestions() {
    return this.healthCheckService.getAllCategoriesWithoutQuestions();
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN)
  updateCategory(
    @Param('id') id: number,
    @Body() data: { name?: string; description?: string; isActive?: boolean }
  ) {
    return this.healthCheckService.updateCategory(id, data);
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN)
  deleteCategory(@Param('id') id: number) {
    return this.healthCheckService.deleteCategory(id);
  }

  // Question endpoints
  @Post('categories/:categoryId/questions')
  @Roles(UserRole.ADMIN)
  createQuestion(
    @Param('categoryId') categoryId: number,
    @Body() questionData: { question: string; options: string[]; order?: number }
  ) {
    return this.healthCheckService.createQuestion(categoryId, questionData);
  }

  @Get('categories/:categoryId/questions')
  @Roles(UserRole.ADMIN, UserRole.USER)
  getQuestionsByCategory(@Param('categoryId') categoryId: number) {
    return this.healthCheckService.getQuestionsByCategory(categoryId);
  }

  @Put('categories/:categoryId/questions/:questionId')
  @Roles(UserRole.ADMIN)
  async updateQuestion(
    @Param('categoryId') categoryId: number,
    @Param('questionId') questionId: number,
    @Body() updateData: {
      question?: string;
      options?: string[];
      order?: number;
      isActive?: boolean;
    }
  ) {
    return this.healthCheckService.updateQuestion(categoryId, questionId, updateData);
  }

  // Submit answers for a specific category
  @Post('categories/:categoryId/submit')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async submitAnswers(
    @Req() req,
    @Param('categoryId') categoryId: number,
    @Body('answers') answers: { questionId: number; answer: string }[]
  ) {
    return this.healthCheckService.submitAnswers(req.user.userId, categoryId, answers);
  }

  // History endpoints
  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getHistory(@Req() req) {
    return this.healthCheckService.getUserHistory(req.user.userId);
  }

  @Get('all-history')
  @Roles(UserRole.ADMIN)
  async getAllHistory() {
    return this.healthCheckService.getAllUsersHistory();
  }

  // Add this new endpoint
  @Post('categories/:categoryId/questions/bulk')
  @Roles(UserRole.ADMIN)
  createQuestions(
    @Param('categoryId') categoryId: number,
    @Body() questionsData: {
      questions: {
        question: string;
        options: string[];
        order: number;
      }[]
    }
  ) {
    return this.healthCheckService.createQuestions(categoryId, questionsData.questions);
  }
} 