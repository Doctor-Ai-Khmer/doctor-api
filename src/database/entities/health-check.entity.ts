import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class HealthCheck {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column('jsonb')
  answers: {
    question: string;
    answer: string;
  }[];

  @Column('text', { nullable: true })
  aiAnalysis: string;

  @CreateDateColumn()
  createdAt: Date;
} 