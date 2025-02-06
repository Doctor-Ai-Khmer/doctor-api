import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

@Entity()
export class HealthCheck {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Category)
  category: Category;

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