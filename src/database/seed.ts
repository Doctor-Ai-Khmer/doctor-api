import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { DatabaseSeeder } from './seeds';
import { dataSourceConfig } from './db.config';

// Load environment variables
config();

async function seed() {
  const dataSource = new DataSource(dataSourceConfig);
  
  try {
    await dataSource.initialize();
    console.log('Database connection established');
    
    const seeder = new DatabaseSeeder(dataSource);
    await seeder.run();
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

// Run the seeder
seed();
