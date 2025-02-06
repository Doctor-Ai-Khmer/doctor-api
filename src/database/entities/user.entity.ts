import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Image } from './image.entity';
import { HealthCheck } from './health-check.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ type: 'text', nullable: true })
  blockReason: string;

  @Column({ default: 0 })
  uploadCount: number;

  @Column({ default: false })
  isPremium: boolean;

  @OneToMany(() => Image, image => image.user)
  images: Image[];

  @OneToMany(() => HealthCheck, healthCheck => healthCheck.user)
  healthChecks: HealthCheck[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 