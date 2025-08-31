import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { CategorySeeder } from './category.seeder';
import { QuestionSeeder } from './question.seeder';
import { dataSourceConfig } from '../db.config';

// Load environment variables
config();

async function testSeed() {
  const dataSource = new DataSource(dataSourceConfig);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');
    
    // Test category seeder
    console.log('\n🧪 Testing Category Seeder...');
    const categorySeeder = new CategorySeeder(dataSource);
    await categorySeeder.seed();
    
    // Test question seeder
    console.log('\n🧪 Testing Question Seeder...');
    const questionSeeder = new QuestionSeeder(dataSource);
    await questionSeeder.seed();
    
    // Verify data was created
    console.log('\n🔍 Verifying seeded data...');
    
    const categoryRepository = dataSource.getRepository('Category');
    const questionRepository = dataSource.getRepository('Question');
    
    const categories = await categoryRepository.find();
    const questions = await questionRepository.find();
    
    console.log(`📊 Categories created: ${categories.length}`);
    console.log(`📊 Questions created: ${questions.length}`);
    
    // Show sample data
    if (categories.length > 0) {
      console.log('\n📋 Sample Categories:');
      categories.slice(0, 3).forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.description}`);
      });
    }
    
    if (questions.length > 0) {
      console.log('\n📋 Sample Questions:');
      questions.slice(0, 3).forEach(q => {
        console.log(`  - ${q.question.substring(0, 50)}...`);
        console.log(`    Options: ${q.options.join(', ')}`);
      });
    }
    
    console.log('\n✅ Test seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Test seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testSeed();
}
