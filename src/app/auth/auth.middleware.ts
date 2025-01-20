import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../database/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        const decoded = await this.jwtService.verifyAsync(token);
        req.user = {
          userId: decoded.sub,
          email: decoded.email,
          role: decoded.role
        };
      }
    } catch (error) {
      console.error('Auth Middleware Error:', error);
    }
    
    next();
  }
} 