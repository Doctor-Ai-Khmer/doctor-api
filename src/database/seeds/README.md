# Database Seeding System

This directory contains the database seeding system for the Doctor AI API.

## Overview

The seeding system automatically populates your database with sample data for development and testing purposes.

## Seeders

### 1. AdminSeeder
- Creates a default admin user
- Uses environment variables for configuration
- Default credentials: `admin@doctorai.com` / `Admin@123`

### 2. CategorySeeder
- Creates 8 medical categories:
  - General Health
  - Cardiology
  - Dermatology
  - Neurology
  - Pediatrics
  - Mental Health
  - Nutrition
  - Emergency Medicine

### 3. QuestionSeeder
- Creates sample questions for each category
- Each category gets 3 questions about the user's personal daily habits and lifestyle choices
- Questions ask users about their actual behaviors (e.g., "How many glasses of water do you drink per day?")
- Questions are ordered and linked to their respective categories
- Designed for Gemini AI to analyze user responses and provide personalized health feedback

## How to Run

### Using npm script (Recommended)
```bash
npm run seed
```

### Manual execution
```bash
npx ts-node -r tsconfig-paths/register src/database/seed.ts
```

## Environment Variables

Set these in your `.env` file to customize the admin user:

```env
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Your Admin Name
```

## Sample Data Structure

### Categories
Each category includes:
- Name
- Description
- Active status

### Questions
Each question includes:
- Question text asking about the user's personal daily habits and behaviors
- Multiple choice options with quantifiable responses (e.g., "0 minutes", "1-2 times per week")
- Category association
- Order number
- Active status

## Safety Features

- **Idempotent**: Running the seeder multiple times won't create duplicates
- **Error Handling**: Graceful error handling with detailed logging
- **Transaction Safety**: Uses TypeORM's transaction system
- **Validation**: Checks for existing data before insertion

## Customization

To add more categories or questions:

1. Edit the respective seeder file
2. Add your data to the arrays
3. Run the seeder again

The system will automatically skip existing data and only add new entries.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your database configuration in `db.config.ts`
   - Ensure your database is running

2. **Permission Denied**
   - Check database user permissions
   - Verify connection string

3. **Duplicate Key Errors**
   - The seeder should handle this automatically
   - Check if data already exists in your database

### Logs

The seeder provides detailed logging:
- Connection status
- Creation progress
- Skipped entries
- Completion status
- Error details

## Development

When adding new entities, consider:

1. Creating a corresponding seeder
2. Adding it to the main `DatabaseSeeder` class
3. Following the existing pattern for consistency
4. Adding appropriate error handling
5. Including duplicate checking logic
