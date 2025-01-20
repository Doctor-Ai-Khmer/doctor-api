import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article } from '../../database/entities/article.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(articleData: any, authorId: number) {
    const author = await this.userRepository.findOne({ where: { id: authorId } });
    const article = this.articleRepository.create({
      ...articleData,
      author
    });
    return this.articleRepository.save(article);
  }

  async findAll(query: { search?: string; tags?: string[] } = {}) {
    const where: any = { isPublished: true };
    
    if (query.search) {
      where.title = Like(`%${query.search}%`);
    }
    
    if (query.tags) {
      where.tags = query.tags;
    }

    return this.articleRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['author']
    });
  }

  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author']
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async update(id: number, updateData: any) {
    const article = await this.findOne(id);
    Object.assign(article, updateData);
    return this.articleRepository.save(article);
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
} 