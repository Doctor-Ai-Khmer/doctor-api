import { DataSource } from 'typeorm';
import { Question } from '../entities/question.entity';
import { Category } from '../entities/category.entity';

export class QuestionSeeder {
  constructor(private dataSource: DataSource) {}

  async seed() {
    const questionRepository = this.dataSource.getRepository(Question);
    const categoryRepository = this.dataSource.getRepository(Category);

    const questionsData = [
      // General Health
      {
        categoryName: 'General Health',
        questions: [
          {
            question: 'How many glasses of water do you drink per day?',
            options: ['Less than 4 glasses', '4-6 glasses', '6-8 glasses', 'More than 8 glasses'],
            order: 1
          },
          {
            question: 'How many hours do you sleep per night?',
            options: ['Less than 5 hours', '5-6 hours', '7-8 hours', 'More than 8 hours'],
            order: 2
          },
          {
            question: 'How often do you skip breakfast?',
            options: ['Never', '1-2 times per week', '3-4 times per week', 'Almost every day'],
            order: 3
          }
        ]
      },
      // Cardiology
      {
        categoryName: 'Cardiology',
        questions: [
          {
            question: 'How many minutes do you exercise per day?',
            options: ['0 minutes', '15-30 minutes', '30-60 minutes', 'More than 60 minutes'],
            order: 1
          },
          {
            question: 'How many times per week do you eat fast food?',
            options: ['Never', '1-2 times', '3-4 times', '5+ times'],
            order: 2
          },
          {
            question: 'Do you smoke cigarettes?',
            options: ['Never', 'Occasionally', '1-5 per day', 'More than 5 per day'],
            order: 3
          }
        ]
      },
      // Dermatology
      {
        categoryName: 'Dermatology',
        questions: [
          {
            question: 'How often do you apply sunscreen when going outside?',
            options: ['Never', 'Only at beach', 'Most sunny days', 'Every day'],
            order: 1
          },
          {
            question: 'How often do you pop pimples when they appear?',
            options: ['Never', 'Rarely', 'Sometimes', 'Almost always'],
            order: 2
          },
          {
            question: 'How long are your showers typically?',
            options: ['Less than 10 minutes', '10-20 minutes', '20-30 minutes', 'More than 30 minutes'],
            order: 3
          }
        ]
      },
      // Neurology
      {
        categoryName: 'Neurology',
        questions: [
          {
            question: 'How long before bedtime do you stop using electronic devices?',
            options: ['I use them until I sleep', '30 minutes before', '1 hour before', '2+ hours before'],
            order: 1
          },
          {
            question: 'How many minutes do you read books per day?',
            options: ['0 minutes', '15-30 minutes', '30-60 minutes', 'More than 60 minutes'],
            order: 2
          },
          {
            question: 'How many hours do you work without taking breaks?',
            options: ['I take regular breaks', '2-3 hours', '4-5 hours', '6+ hours'],
            order: 3
          }
        ]
      },
      // Pediatrics
      {
        categoryName: 'Pediatrics',
        questions: [
          {
            question: 'How many hours do your children play outside daily?',
            options: ['Less than 1 hour', '1-2 hours', '2-3 hours', 'More than 3 hours'],
            order: 1
          },
          {
            question: 'How often do you give children sugary snacks before bedtime?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often'],
            order: 2
          },
          {
            question: 'How many hours of screen time do you allow your children per day?',
            options: ['Less than 1 hour', '1-2 hours', '2-3 hours', 'More than 3 hours'],
            order: 3
          }
        ]
      },
      // Mental Health
      {
        categoryName: 'Mental Health',
        questions: [
          {
            question: 'How many minutes do you practice meditation or mindfulness daily?',
            options: ['0 minutes', '5-10 minutes', '10-20 minutes', 'More than 20 minutes'],
            order: 1
          },
          {
            question: 'How often do you talk about your problems with others?',
            options: ['Never', 'Rarely', 'Sometimes', 'Often'],
            order: 2
          },
          {
            question: 'How often do you take breaks during work hours?',
            options: ['Never', 'Rarely', 'Sometimes', 'Every hour'],
            order: 3
          }
        ]
      },
      // Nutrition
      {
        categoryName: 'Nutrition',
        questions: [
          {
            question: 'How many meals per day include vegetables?',
            options: ['0 meals', '1 meal', '2 meals', '3+ meals'],
            order: 1
          },
          {
            question: 'How many glasses of soda do you drink per day?',
            options: ['0 glasses', '1-2 glasses', '3-4 glasses', 'More than 4 glasses'],
            order: 2
          },
          {
            question: 'How often do you plan your meals ahead of time?',
            options: ['Never', 'Rarely', 'Sometimes', 'Most days'],
            order: 3
          }
        ],
      },
      // Emergency Medicine
      {
        categoryName: 'Emergency Medicine',
        questions: [
          {
            question: 'How often do you wear a seatbelt when driving?',
            options: ['Never', 'Sometimes', 'Most times', 'Always'],
            order: 1
          },
          {
            question: 'How often do you seek medical help for minor injuries?',
            options: ['Always', 'Sometimes', 'Rarely', 'Never'],
            order: 2
          },
          {
            question: 'Do you have a first aid kit at home?',
            options: ['No', 'Yes, but incomplete', 'Yes, basic kit', 'Yes, comprehensive kit'],
            order: 3
          }
        ]
      }
    ];

    for (const categoryData of questionsData) {
      // Find the category
      const category = await categoryRepository.findOne({
        where: { name: categoryData.categoryName }
      });

      if (!category) {
        console.log(`Category "${categoryData.categoryName}" not found, skipping questions...`);
        continue;
      }

      for (const questionData of categoryData.questions) {
        // Check if question already exists
        const existingQuestion = await questionRepository.findOne({
          where: { 
            question: questionData.question,
            category: { id: category.id }
          }
        });

        if (existingQuestion) {
          console.log(`Question "${questionData.question.substring(0, 30)}..." already exists, skipping...`);
          continue;
        }

        // Create new question
        const question = questionRepository.create({
          ...questionData,
          category: category,
          isActive: true
        });

        await questionRepository.save(question);
        console.log(`Question for "${categoryData.categoryName}" created successfully`);
      }
    }

    console.log('Question seeding completed');
  }
}
