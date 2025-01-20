import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthCheck } from '../../database/entities/health-check.entity';
import { Question } from '../../database/entities/question.entity';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class HealthCheckService {
  constructor(
    @InjectRepository(HealthCheck)
    private healthCheckRepository: Repository<HealthCheck>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    private geminiService: GeminiService
  ) {}

  async getQuestions() {
    return this.questionRepository.find({
      where: { isActive: true },
      order: { order: 'ASC' }
    });
  }

  // Add method to create questions
  async createQuestion(questionData: { question: string; options: string[]; order?: number }) {
    const question = this.questionRepository.create({
      ...questionData,
      order: questionData.order || 0
    });
    return this.questionRepository.save(question);
  }

  // Add method to update questions
  async updateQuestion(id: number, questionData: Partial<Question>) {
    await this.questionRepository.update(id, questionData);
    return this.questionRepository.findOne({ where: { id } });
  }

  // Add method to delete questions
  async deleteQuestion(id: number) {
    await this.questionRepository.update(id, { isActive: false });
  }

  async submitAnswers(userId: number, answers: { question: string; answer: string }[]) {
    const healthCheck = this.healthCheckRepository.create({
      user: { id: userId },
      answers: answers
    });

    // Generate prompt for AI analysis
    const prompt = `
      Based on the following health check answers, provide a medical analysis in Khmer language:
      ${answers.map(a => `Question: ${a.question}\nAnswer: ${a.answer}`).join('\n\n')}
      
      Please analyze these symptoms and provide:
      1. Possible conditions
      2. Severity level
      3. Recommendations
      4. Whether immediate medical attention is needed
    `;

    // Get AI analysis
    const analysis = await this.geminiService.generateText(prompt);
    healthCheck.aiAnalysis = analysis;

    return this.healthCheckRepository.save(healthCheck);
  }

  async getUserHistory(userId: number) {
    return this.healthCheckRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' }
    });
  }

  // Add this new method for admin to view all users' history
  async getAllUsersHistory() {
    return this.healthCheckRepository.find({
      relations: ['user'],  // Include user information
      order: { createdAt: 'DESC' },
      select: {  // Select specific fields to return
        id: true,
        answers: true,
        aiAnalysis: true,
        createdAt: true,
        user: {
          id: true,
          email: true,
          fullName: true
        }
      }
    });
  }
} 