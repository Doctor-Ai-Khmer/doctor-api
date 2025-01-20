import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  subtitle: string;

  @Column('text')
  content: string;

  @Column('jsonb', { nullable: true })
  images: {
    url: string;
    caption: string;
    position: number;
  }[];

  @Column('text', { array: true, default: [] })
  tags: string[];

  @ManyToOne(() => User)
  author: User;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 