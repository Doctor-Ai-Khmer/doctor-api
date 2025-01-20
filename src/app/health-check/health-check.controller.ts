import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { HealthCheckService } from './health-check.service';
import { Question } from '../../database/entities/question.entity';

@Controller('health-check')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HealthCheckController {
  constructor(private healthCheckService: HealthCheckService) {}

  // Admin-only endpoints
  @Post('questions')
  @Roles(UserRole.ADMIN)
  createQuestion(@Body() questionData: { question: string; options: string[]; order?: number }) {
    return this.healthCheckService.createQuestion(questionData);
  }

  @Put('questions/:id')
  @Roles(UserRole.ADMIN)
  updateQuestion(@Param('id') id: number, @Body() questionData: Partial<Question>) {
    return this.healthCheckService.updateQuestion(id, questionData);
  }

  @Delete('questions/:id')
  @Roles(UserRole.ADMIN)
  deleteQuestion(@Param('id') id: number) {
    return this.healthCheckService.deleteQuestion(id);
  }

  // User endpoints (accessible by both admin and users)
  @Get('questions')
  @Roles(UserRole.ADMIN, UserRole.USER)
  getQuestions() {
    return this.healthCheckService.getQuestions();
  }

  @Post('submit')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async submitAnswers(
    @Req() req,
    @Body('answers') answers: { question: string; answer: string }[]
  ) {
    return this.healthCheckService.submitAnswers(req.user.userId, answers);
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getHistory(@Req() req) {
    return this.healthCheckService.getUserHistory(req.user.userId);
  }

  // Admin-only endpoint to view all users' history
  @Get('all-history')
  @Roles(UserRole.ADMIN)
  async getAllHistory() {
    return this.healthCheckService.getAllUsersHistory();
  }
} 