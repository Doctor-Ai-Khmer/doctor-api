import { DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';

export class CategorySeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const categoryRepository = this.dataSource.getRepository(Category);

    const categories = [
      {
        name: 'General Health',
        description: 'Basic health and wellness questions covering common health topics',
        isActive: true
      },
      {
        name: 'Cardiology',
        description: 'Heart and cardiovascular system related questions',
        isActive: true
      },
      {
        name: 'Dermatology',
        description: 'Skin, hair, and nail related health questions',
        isActive: true
      },
      {
        name: 'Neurology',
        description: 'Brain, nervous system, and neurological conditions',
        isActive: true
      },
      {
        name: 'Pediatrics',
        description: 'Child health and development questions',
        isActive: true
      },
      {
        name: 'Mental Health',
        description: 'Psychological and emotional well-being questions',
        isActive: true
      },
      {
        name: 'Nutrition',
        description: 'Diet, nutrition, and healthy eating questions',
        isActive: true
      },
      {
        name: 'Emergency Medicine',
        description: 'Urgent care and emergency medical situations',
        isActive: true
      }
    ];

    for (const categoryData of categories) {
      // Check if category already exists
      const existingCategory = await categoryRepository.findOne({
        where: { name: categoryData.name }
      });

      if (existingCategory) {
        console.log(`Category "${categoryData.name}" already exists, skipping...`);
        continue;
      }

      // Create new category
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`Category "${categoryData.name}" created successfully`);
    }

    console.log('Category seeding completed');
  }
}
