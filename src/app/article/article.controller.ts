import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { ArticleService } from './article.service';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('tags') tags?: string[],
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy = 'createdAt',
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC' = 'DESC'
  ) {
    const filters = { search, tags };
    const pagination = { page, limit, sortBy, sortOrder };
    return this.articleService.findAll(filters, pagination, req.user?.userId);
  }

  @Get('featured')
  async getFeatured() {
    const filters = { isPublished: true };
    const pagination = { 
      page: 1, 
      limit: 5, 
      sortBy: 'createdAt', 
      sortOrder: 'DESC' as const 
    };
    const result = await this.articleService.findAll(filters, pagination);
    return result.data;
  }

  @Get('latest')
  async getLatest() {
    const filters = { isPublished: true };
    const pagination = { 
      page: 1, 
      limit: 10, 
      sortBy: 'createdAt', 
      sortOrder: 'DESC' as const 
    };
    const result = await this.articleService.findAll(filters, pagination);
    return result.data;
  }

  @Get('tags/all')
  getAllTags() {
    return this.articleService.getAllTags();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() articleData: any, @Req() req: any) {
    return this.articleService.create(articleData, req.user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateData: any) {
    return this.articleService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.delete(id);
  }
} 