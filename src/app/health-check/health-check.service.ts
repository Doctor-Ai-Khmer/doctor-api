import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthCheck } from '../../database/entities/health-check.entity';
import { Question } from '../../database/entities/question.entity';
import { Category } from '../../database/entities/category.entity';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class HealthCheckService {
  constructor(
    @InjectRepository(HealthCheck)
    private healthCheckRepository: Repository<HealthCheck>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private geminiService: GeminiService
  ) {}

  // Category management
  async createCategory(data: { name: string; description?: string }) {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: data.name }
    });

    if (existingCategory) {
      throw new BadRequestException('Category already exists');
    }

    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async getAllCategories() {
    return this.categoryRepository.find({
      where: { isActive: true },
      relations: ['questions'],
      order: { name: 'ASC' }
    });
  }

  async getAllCategoriesWithoutQuestions() {
    return this.categoryRepository.find({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        isActive: true
      },
      order: { name: 'ASC' }
    });
  }

  async updateCategory(id: number, data: { name?: string; description?: string; isActive?: boolean }) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.update(id, data);
    return this.categoryRepository.findOne({ 
      where: { id },
      relations: ['questions']
    });
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryRepository.update(id, { isActive: false });
  }

  // Question management
  async createQuestion(categoryId: number, questionData: { 
    question: string;
    options: string[];
    order?: number;
  }) {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const question = this.questionRepository.create({
      ...questionData,
      category,
      order: questionData.order || 0
    });
    return this.questionRepository.save(question);
  }

  async getQuestionsByCategory(categoryId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, isActive: true },
      relations: ['questions'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category.questions.filter(q => q.isActive).sort((a, b) => a.order - b.order);
  }

  // Submit answers with category context
  async submitAnswers(userId: number, categoryId: number, answers: { questionId: number; answer: string }[]) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['questions']
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Get full question details for each answer
    const questionsWithAnswers = await Promise.all(
      answers.map(async (answer) => {
        const question = await this.questionRepository.findOne({
          where: { id: answer.questionId }
        });
        return {
          question: question.question,
          answer: answer.answer
        };
      })
    );

    const healthCheck = this.healthCheckRepository.create({
      user: { id: userId },
      category: { id: categoryId },
      answers: questionsWithAnswers
    });

    // Generate AI analysis prompt based on category
    const prompt = `
      Analyze the following ${category.name} health check responses and provide a detailed analysis in Khmer language:
      ${questionsWithAnswers.map(qa => `Question: ${qa.question}\nAnswer: ${qa.answer}`).join('\n\n')}
      
      For this ${category.name} health assessment, please provide:
      1. Overall ${category.name} health status
      2. Specific concerns or issues identified
      3. Recommended actions or lifestyle changes
      4. Whether professional consultation is advised
      5. Tips for improvement
    `;

    const analysis = await this.geminiService.generateText(prompt);
    healthCheck.aiAnalysis = analysis;

    return this.healthCheckRepository.save(healthCheck);
  }

  // Add methods for history
  async getUserHistory(userId: number) {
    return this.healthCheckRepository.find({
      where: { user: { id: userId } },
      relations: ['category', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getAllUsersHistory() {
    return this.healthCheckRepository.find({
      relations: ['category', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  // Add this method to HealthCheckService
  async updateQuestion(categoryId: number, questionId: number, updateData: {
    question?: string;
    options?: string[];
    order?: number;
    isActive?: boolean;
  }) {
    const category = await this.categoryRepository.findOne({ 
      where: { id: categoryId }
    });
    
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const question = await this.questionRepository.findOne({
      where: { id: questionId, category: { id: categoryId } }
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.questionRepository.update(questionId, updateData);
    
    return this.questionRepository.findOne({
      where: { id: questionId }
    });
  }

  // Add this new method
  async createQuestions(categoryId: number, questions: {
    question: string;
    options: string[];
    order: number;
  }[]) {
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const createdQuestions = await Promise.all(
      questions.map(async (questionData) => {
        const question = this.questionRepository.create({
          ...questionData,
          category,
        });
        return await this.questionRepository.save(question);
      })
    );

    return createdQuestions;
  }
} 