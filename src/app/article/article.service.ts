import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article } from '../../database/entities/article.entity';
import { User } from '../../database/entities/user.entity';
import { UserRole } from '../../database/entities/user.entity';

interface ArticleFilters {
  search?: string;
  tags?: string[];
  isPublished?: boolean;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(articleData: any, userId: number) {
    // Validate required fields
    if (!articleData.authorName) {
      throw new BadRequestException('Author name is required');
    }

    // Handle tags if they come as a string
    if (articleData.tags && typeof articleData.tags === 'string') {
      articleData.tags = articleData.tags.split(',').map(tag => tag.trim());
    }
    
    const article = this.articleRepository.create(articleData);
    return this.articleRepository.save(article);
  }

  async findAll(filters: ArticleFilters = {}, pagination: PaginationOptions = { page: 1, limit: 10 }, userId?: number) {
    const query = this.articleRepository.createQueryBuilder('article');
    
    // Check user role
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    // Apply filters
    if (!user || user.role !== UserRole.ADMIN) {
      query.andWhere('article.isPublished = :isPublished', { isPublished: true });
    }
    
    if (filters.search) {
      query.andWhere('(article.title ILIKE :search OR article.content ILIKE :search)', 
        { search: `%${filters.search}%` });
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.andWhere('article.tags && :tags', { tags: filters.tags });
    }

    // Apply sorting
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'DESC';
    query.orderBy(`article.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (pagination.page - 1) * pagination.limit;
    query.skip(skip).take(pagination.limit);

    // Get results and count
    const [articles, total] = await query.getManyAndCount();

    // Transform the data for display
    const transformedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      subtitle: article.subtitle,
      content: article.content,
      thumbnail: article.thumbnail,
      authorName: article.authorName,
      tags: article.tags,
      isPublished: article.isPublished,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      preview: this.generatePreview(article.content)
    }));

    return {
      data: transformedArticles,
      pagination: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };
  }

  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id }
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return {
      ...article,
      preview: this.generatePreview(article.content)
    };
  }

  async update(id: number, updateData: any) {
    const article = await this.findOne(id);
    
    // Remove timestamp fields from updateData if they exist
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Handle tags if they come as a string
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    const updatedArticle = this.articleRepository.create({
      ...article,
      ...updateData,
    });
    
    return this.articleRepository.save(updatedArticle);
  }

  async delete(id: number) {
    const article = await this.findOne(id);
    return this.articleRepository.remove(article);
  }

  async getAllTags() {
    const articles = await this.articleRepository.find();
    const tags = new Set(articles.flatMap(article => article.tags));
    return Array.from(tags);
  }

  private generatePreview(content: string): string {
    // Remove HTML tags and get first 200 characters
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 200 
      ? `${plainText.substring(0, 200)}...` 
      : plainText;
  }
} 