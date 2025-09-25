# FitRecipes Backend

A modern, scalable backend API for the FitRecipes healthy recipes web application, built with **Hono.js**, **TypeScript**, **Bun runtime**, **Prisma ORM**, and **Supabase**.

## 🚀 Tech Stack

- **Runtime**: Bun
- **Framework**: Hono.js with TypeScript
- **Database**: PostgreSQL (Supabase hosted)
- **ORM**: Prisma
- **Storage**: Supabase Storage
- **Authentication**: JWT
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Containerization**: Docker + Docker Compose
- **Deployment**: Render (with Kubernetes migration path)
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
src/
├── routes/           # API route definitions
│   ├── auth.ts      # Authentication endpoints
│   ├── recipe.ts    # Recipe CRUD operations
│   ├── admin.ts     # Admin management endpoints
│   └── community.ts # Comments and ratings
├── controllers/      # Request handlers
├── services/        # Business logic layer
├── middlewares/     # Custom middleware
│   ├── auth.ts      # Authentication & authorization
│   ├── rateLimit.ts # Rate limiting
│   └── common.ts    # CORS, error handling
├── models/          # Prisma schema
├── utils/           # Utility functions
│   ├── database.ts  # Prisma client
│   ├── supabase.ts  # Storage operations
│   ├── auth.ts      # JWT & password utilities
│   └── helpers.ts   # Common helpers
├── types/           # TypeScript definitions
└── index.ts         # Application entry point

tests/               # Test files
├── utils/          # Unit tests for utilities
└── setup.ts        # Test configuration

prisma/
└── schema.prisma   # Database schema

.github/
└── workflows/      # CI/CD pipelines
```

## 🚦 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Docker](https://www.docker.com/) (optional, for containerization)
- [Supabase](https://supabase.com/) account

### 1. Clone and Install

```bash
git clone https://github.com/YourUsername/FitRecipes-Backend.git
cd FitRecipes-Backend
bun install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Configure your `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=recipe-images

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGIN=http://localhost:3001
```

### 3. Database Setup

```bash
# Generate Prisma client
bun run db:generate

# Run database migrations
bun run db:migrate

# (Optional) Open Prisma Studio
bun run db:studio
```

### 4. Development Server

```bash
# Start development server with hot reload
bun run dev

# The API will be available at:
# Health check: http://localhost:3000/health
# API base: http://localhost:3000/api/v1
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run tests with UI
bun run test:ui

# Run specific test file
bun test tests/utils/helpers.test.ts
```

## 🎯 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation
- `GET /verify-email/:token` - Email verification
- `GET /me` - Get current user profile

### Recipes (`/api/v1/recipes`)
- `GET /search` - Search recipes by ingredients
- `GET /` - Browse and filter recipes
- `GET /recommendations` - Get personalized recommendations
- `GET /:id` - Get recipe details
- `POST /` - Submit new recipe (Chef only)
- `PUT /:id` - Update recipe (Chef only, own recipes)
- `DELETE /:id` - Delete recipe (Chef only, own recipes)

### Community (`/api/v1/community`)
- `GET /recipes/:id/comments` - Get recipe comments
- `POST /recipes/:id/comments` - Add comment
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment
- `POST /recipes/:id/rating` - Rate recipe
- `GET /recipes/:id/rating` - Get user's rating
- `DELETE /recipes/:id/rating` - Remove rating
- `GET /recipes/:id/ratings` - Get ratings summary

### Admin (`/api/v1/admin`)
- `GET /recipes/pending` - Get pending recipes
- `POST /recipes/:id/approve` - Approve recipe
- `POST /recipes/:id/reject` - Reject recipe
- `GET /users` - Get users list
- `PUT /users/:id/role` - Update user role
- `GET /stats` - Get platform statistics

## 🔒 Authentication & Authorization

- **JWT-based authentication** with configurable expiration
- **Role-based access control** (USER, CHEF, ADMIN)
- **Rate limiting** to prevent abuse
- **Password hashing** with bcrypt
- **Session management** with token validation

## 📊 Performance Features

- **Rate limiting**: 100 requests per 15 minutes per IP
- **Response caching** for popular/trending recipes
- **Database indexing** for optimized queries
- **Horizontal scaling** support via Docker Compose
- **Health check endpoints** for monitoring

## 🔧 Code Quality

```bash
# Linting
bun run lint
bun run lint:fix

# Formatting
bun run format
bun run format:check
```

## 🐳 Docker Deployment

### Local Development

```bash
# Build and run with Docker Compose
bun run docker:build
bun run docker:run

# Stop services
bun run docker:down
```

### Production Build

```bash
# Build production image
docker build -t fitrecipes-backend .

# Run production container
docker run -p 3000:3000 --env-file .env fitrecipes-backend
```

## 🚀 Deployment

### Render Deployment

1. **Connect Repository**: Link your GitHub repository to Render
2. **Environment Variables**: Configure environment variables in Render dashboard
3. **Database**: Use Supabase PostgreSQL (recommended) or Render PostgreSQL
4. **Storage**: Configure Supabase Storage bucket
5. **Deploy**: Push to main branch triggers automatic deployment

### Future Kubernetes Migration

The application is designed for easy migration to Kubernetes:

```yaml
# Example Kubernetes deployment (k8s/deployment.yaml)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fitrecipes-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fitrecipes-backend
  template:
    metadata:
      labels:
        app: fitrecipes-backend
    spec:
      containers:
      - name: backend
        image: fitrecipes-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## 🔄 CI/CD Pipeline

GitHub Actions workflow includes:

1. **Testing**: Unit tests, integration tests, coverage reports
2. **Linting**: Code quality checks with ESLint
3. **Security**: Vulnerability scanning with Trivy
4. **Build**: Docker image creation
5. **Deploy**: Automatic deployment to Render on main branch
6. **Notify**: Slack notifications for deployment status

## 📈 Monitoring & Scaling

### Health Checks

- `GET /health` - Application health status
- Database connectivity check
- Supabase service availability

### Scaling Configuration

**Docker Compose** (Current):
```yaml
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
```

**Kubernetes** (Future):
```yaml
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
```

## 🛡️ Security Features

- **Input sanitization** for all user inputs
- **SQL injection prevention** via Prisma ORM
- **XSS protection** with proper content sanitization
- **Rate limiting** to prevent DoS attacks
- **JWT token validation** with expiration
- **Password strength requirements**
- **Failed login attempt tracking**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write unit tests for new features
- Use conventional commit messages
- Update documentation for API changes
- Ensure all CI checks pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [FitRecipes Frontend](https://github.com/YourUsername/FitRecipes-Frontend) - React.js frontend application
- [FitRecipes Mobile](https://github.com/YourUsername/FitRecipes-Mobile) - React Native mobile app

## 📞 Support

For support and questions:

- Create an [Issue](https://github.com/YourUsername/FitRecipes-Backend/issues)
- Join our [Discord](https://discord.gg/fitrecipes)
- Email: support@fitrecipes.com

---

**Made with ❤️ by the FitRecipes Team**