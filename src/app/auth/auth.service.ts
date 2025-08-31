import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { HealthCheck } from '../../database/entities/health-check.entity';
import { Article } from '../../database/entities/article.entity';
import { Image } from '../../database/entities/image.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../database/entities/user.entity';
import { MoreThanOrEqual } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(HealthCheck)
    private healthCheckRepository: Repository<HealthCheck>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: { email: string; password: string; fullName: string }) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.USER, // Always set to USER role for security
    });

    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new ForbiddenException(`Your account has been blocked. Reason: ${user.blockReason || 'Not specified'}`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role 
    };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isBlocked: user.isBlocked
      },
    };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from google');
    }

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { email: req.user.email },
    });

    if (!user) {
      // Create new user from Google data
      user = this.userRepository.create({
        email: req.user.email,
        fullName: req.user.fullName,
        isActive: true,
        // Set a random password or handle it differently
        password: await bcrypt.hash(Math.random().toString(36), 10),
      });
      await this.userRepository.save(user);
    }

    const payload = { email: user.email, sub: user.id };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async getAllUsers() {
    return this.userRepository.find({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        isPremium: true,
        uploadCount: true,
        isBlocked: true,
        blockReason: true,
        createdAt: true,
        updatedAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getDashboardData() {
    // Get user statistics with more details
    const [users, totalUsers] = await this.userRepository.findAndCount();
    const premiumUsers = users.filter(user => user.isPremium).length;
    const activeUsers = users.filter(user => user.isActive).length;
    const adminUsers = users.filter(user => user.role === UserRole.ADMIN).length;
    const regularUsers = users.filter(user => user.role === UserRole.USER).length;

    // Get today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(today)
      }
    });

    // Get this month's statistics
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newUsersThisMonth = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(firstDayOfMonth)
      }
    });

    // Get all users with detailed information
    const allUsers = await this.userRepository.find({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        isPremium: true,
        uploadCount: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'DESC' },
    });

    // Get user activity statistics
    const userUploads = await this.imageRepository
      .createQueryBuilder('image')
      .select('user.id', 'userId')
      .addSelect('COUNT(*)', 'uploadCount')
      .innerJoin('image.user', 'user')
      .groupBy('user.id')
      .getRawMany();

    const userHealthChecks = await this.healthCheckRepository
      .createQueryBuilder('healthCheck')
      .select('user.id', 'userId')
      .addSelect('COUNT(*)', 'checkCount')
      .innerJoin('healthCheck.user', 'user')
      .groupBy('user.id')
      .getRawMany();

    // Get health check statistics
    const totalHealthChecks = await this.healthCheckRepository.count();
    const healthChecksToday = await this.healthCheckRepository.count({
      where: {
        createdAt: MoreThanOrEqual(today)
      }
    });

    const recentHealthChecks = await this.healthCheckRepository.find({
      relations: ['user'],
      select: {
        id: true,
        createdAt: true,
        answers: true,
        aiAnalysis: true,
        user: {
          id: true,
          fullName: true,
          email: true
        }
      },
      order: { createdAt: 'DESC' },
      take: 5
    });

    // Get article statistics
    const totalArticles = await this.articleRepository.count();
    const publishedArticles = await this.articleRepository.count({ 
      where: { isPublished: true } 
    });
    const articlesToday = await this.articleRepository.count({
      where: {
        createdAt: MoreThanOrEqual(today)
      }
    });

    // Get image upload statistics
    const totalImages = await this.imageRepository.count();
    const uploadsToday = await this.imageRepository.count({
      where: {
        createdAt: MoreThanOrEqual(today)
      }
    });

    return {
      statistics: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          admin: adminUsers,
          regular: regularUsers,
          newToday: newUsersToday,
          newThisMonth: newUsersThisMonth
        },
        healthChecks: {
          total: totalHealthChecks,
          today: healthChecksToday
        },
        articles: {
          total: totalArticles,
          published: publishedArticles,
          draft: totalArticles - publishedArticles,
          today: articlesToday
        },
        uploads: {
          total: totalImages,
          today: uploadsToday
        }
      },
      userData: {
        allUsers: allUsers.map(user => ({
          ...user,
          activity: {
            uploads: userUploads.find(u => u.userId === user.id)?.uploadCount || 0,
            healthChecks: userHealthChecks.find(u => u.userId === user.id)?.checkCount || 0
          }
        }))
      },
      recentActivity: {
        healthChecks: recentHealthChecks
      }
    };
  }

  async blockUser(userId: number, blockReason: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot block an admin user');
    }

    user.isBlocked = true;
    user.blockReason = blockReason;
    await this.userRepository.save(user);

    return {
      message: `User ${user.email} has been blocked`,
      reason: blockReason
    };
  }

  async unblockUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.isBlocked = false;
    user.blockReason = null;
    await this.userRepository.save(user);

    return {
      message: `User ${user.email} has been unblocked`
    };
  }

  // Internal method for creating admin users - NOT exposed via API
  async createAdminUser(adminData: { email: string; password: string; fullName: string }) {
    const existingUser = await this.userRepository.findOne({
      where: { email: adminData.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    
    const adminUser = this.userRepository.create({
      ...adminData,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isPremium: true,
    });

    await this.userRepository.save(adminUser);

    const { password, ...result } = adminUser;
    return result;
  }

  async getBlockedUsers() {
    return this.userRepository.find({
      where: { isBlocked: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        blockReason: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
} 