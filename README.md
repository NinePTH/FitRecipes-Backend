# FitRecipes Backend

A comprehensive TypeScript backend built with Hono.js framework for healthy food enthusiasts to explore, contribute, and share healthy recipes under admin moderation.

## 🚀 Features

- **User Authentication**: JWT-based authentication with role management
- **Recipe Management**: CRUD operations with approval workflow
- **Admin Panel**: Recipe moderation and user management
- **Comments & Ratings**: Full interactive commenting and rating system
- **Search & Filtering**: Advanced search with multiple filters
- **Infinite Scroll**: Cursor-based pagination for optimal performance
- **Security**: Rate limiting, CORS, input validation, and password hashing
- **Docker Support**: Full containerization with multi-stage builds
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment

## 🛠 Tech Stack

- **Framework**: Hono.js (TypeScript web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod schema validation
- **Security**: bcryptjs for password hashing
- **Container**: Docker with Alpine Linux
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
src/
├── controllers/     # HTTP request handlers
├── services/       # Business logic layer
├── middleware/     # Custom middleware (auth, CORS, etc.)
├── routes/         # API route definitions
├── utils/          # Helper functions and utilities
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── index.ts        # Application entry point

prisma/
├── schema.prisma   # Database schema
└── seed.ts         # Database seeding script
```

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NinePTH/FitRecipes-Backend.git
cd FitRecipes-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
docker build -t fitrecipes-backend .

# Run the container
docker run -p 3000:3000 --env-file .env fitrecipes-backend
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/logout` - Logout

### Recipe Endpoints
- `GET /recipes` - List recipes (with pagination and filters)
- `GET /recipes/search` - Search recipes
- `GET /recipes/:id` - Get single recipe
- `POST /recipes` - Create recipe (authenticated)
- `PUT /recipes/:id` - Update recipe (owner/admin)
- `DELETE /recipes/:id` - Delete recipe (owner/admin)

### Comment Endpoints
- `GET /recipes/:id/comments` - Get recipe comments
- `POST /recipes/:id/comments` - Add comment
- `PUT /recipes/:id/comments/:commentId` - Update comment
- `DELETE /recipes/:id/comments/:commentId` - Delete comment

### Rating Endpoints
- `GET /recipes/:id/ratings` - Get recipe ratings
- `GET /recipes/:id/rating` - Get user's rating
- `POST /recipes/:id/rating` - Rate recipe
- `DELETE /recipes/:id/rating` - Delete rating

### Admin Endpoints
- `GET /admin/recipes/pending` - Get pending recipes
- `POST /admin/recipes/:id/approve` - Approve recipe
- `POST /admin/recipes/:id/reject` - Reject recipe

### Category Endpoints
- `GET /categories` - List all categories
- `GET /categories/:id` - Get single category
- `POST /categories` - Create category (admin)
- `PUT /categories/:id` - Update category (admin)
- `DELETE /categories/:id` - Delete category (admin)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔧 Development

```bash
# Start development server with hot reload
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run db:studio      # Open Prisma Studio
```

## 🌍 Environment Variables

See `.env.example` for all available environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - CORS allowed origins
- `RATE_LIMIT_*` - Rate limiting configuration

## 🚢 Production Deployment

The application includes a complete CI/CD pipeline with GitHub Actions:

1. **Testing**: Runs linting, type checking, and tests
2. **Building**: Creates optimized Docker image
3. **Deployment**: Pushes to production (configure as needed)

### Health Checks

The application includes health check endpoints:
- `GET /api/health` - API health status
- Docker health checks included in Dockerfile

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Default Users

After seeding the database:

- **Admin**: admin@fitrecipes.com / admin123
- **User**: user@fitrecipes.com / user123

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.
