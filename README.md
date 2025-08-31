# Doctor AI API

A modern healthcare platform API built with NestJS, providing features for health checks, article management, and image processing.

## Features

### 🏥 Health Check System
- Multiple-choice questionnaire system
- AI-powered analysis of user responses
- History tracking for user health checks
- Admin access to view all users' health histories

### 📝 Article Management
- Admin-only article creation and management
- Support for rich content with images
- Tagging system for better organization
- Search functionality by title and tags
- Public access for reading articles

### 🖼️ Image Upload System
- Secure image upload functionality
- Two-image limit for regular users
- Unlimited uploads for admin users
- Support for future premium user features

### 👤 User Management
- Role-based access control (Admin/User)
- JWT-based authentication
- Secure middleware implementation
- Protected routes based on user roles

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- Google Cloud API Key (for Gemini AI integration)

### Environment Setup
Create a `.env` file in the root directory with:

```bash
DATABASE_HOST=your_db_host
DATABASE_PORT=your_db_port
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=your_db_name
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION_TIME=24h
GOOGLE_API_KEY=your_gemini_api_key
```

### Installation
```bash
# Install dependencies
npm install
```

### Running the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Health Check
- `GET /health-check/questions` - Get health check questions
- `POST /health-check/submit` - Submit health check answers
- `GET /health-check/history` - Get user's health check history
- `GET /health-check/all-history` - Get all users' history (Admin only)

### Articles
- `GET /articles` - List all published articles
- `GET /articles/:id` - Get specific article
- `GET /articles/tags/all` - Get all article tags
- `POST /articles` - Create article (Admin only)
- `PUT /articles/:id` - Update article (Admin only)
- `DELETE /articles/:id` - Delete article (Admin only)

### Image Upload
- `POST /upload` - Upload image
- `GET /upload/remaining` - Check remaining upload quota

## Security
- JWT-based authentication
- Role-based access control
- Request validation
- Rate limiting for uploads
- Secure file upload handling

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License.
