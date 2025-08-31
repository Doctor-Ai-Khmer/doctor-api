import { DataSource } from 'typeorm';
import { AdminSeeder } from './admin.seeder';
import { CategorySeeder } from './category.seeder';
import { QuestionSeeder } from './question.seeder';

export class DatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async run() {
    console.log('Starting database seeding...');
    
    try {
      // Run admin seeder
      const adminSeeder = new AdminSeeder(this.dataSource);
      await adminSeeder.seed();
      
      // Run category seeder
      const categorySeeder = new CategorySeeder(this.dataSource);
      await categorySeeder.seed();
      
      // Run question seeder
      const questionSeeder = new QuestionSeeder(this.dataSource);
      await questionSeeder.seed();
      
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    }
  }
}
