# FitRecipes Backend - Extended Features & Context

## Project Overview
FitRecipes Backend is a comprehensive TypeScript backend built with Hono.js framework, designed for healthy food enthusiasts to explore, contribute, and share healthy recipes under admin moderation.

## Architecture & Tech Stack

### Core Technologies
- **Framework**: Hono.js (lightweight, fast web framework for TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Language**: TypeScript
- **Container**: Docker
- **CI/CD**: GitHub Actions

### Project Structure (MVC-like)
```
src/
├── controllers/     # Route handlers and business logic
├── models/         # Prisma models and database schemas
├── services/       # Business logic services
├── middleware/     # Authentication, validation, error handling
├── routes/         # API route definitions
├── utils/          # Helper functions and utilities
├── types/          # TypeScript type definitions
└── config/         # Configuration files
```

## Core Features

### 1. User Authentication System
- **User Registration**: Email/password with validation
- **User Login**: JWT token generation
- **Password Security**: Bcrypt hashing
- **Role-based Access**: Admin and regular user roles
- **JWT Middleware**: Protected route authentication
- **Token Refresh**: Secure token renewal mechanism

### 2. Recipe Management
- **Recipe Submission**: Users can submit new recipes
- **Recipe CRUD**: Create, Read, Update, Delete operations
- **Image Upload**: Support for recipe images
- **Recipe Categories**: Categorization system (breakfast, lunch, dinner, snacks, etc.)
- **Nutritional Information**: Calories, protein, carbs, fats, etc.
- **Ingredients Management**: Structured ingredient lists with quantities
- **Cooking Instructions**: Step-by-step preparation guide
- **Difficulty Levels**: Easy, Medium, Hard
- **Cooking Time**: Prep time and cook time tracking

### 3. Recipe Approval System
- **Admin Dashboard**: Recipe moderation interface
- **Approval Workflow**: Pending → Approved → Published
- **Rejection System**: Admin can reject with reasons
- **Bulk Operations**: Approve/reject multiple recipes
- **Moderation History**: Track all moderation actions

### 4. Search & Browse System
- **Full-text Search**: Search by recipe name, ingredients, description
- **Advanced Filters**: 
  - By category (breakfast, lunch, dinner, etc.)
  - By difficulty level
  - By cooking time range
  - By nutritional values
  - By ratings
- **Sorting Options**: By date, popularity, ratings, cooking time
- **Faceted Search**: Multiple filter combinations

### 5. Infinite Scroll Pagination
- **Cursor-based Pagination**: Efficient large dataset handling
- **Performance Optimization**: Load 20 items per page initially
- **Smooth UX**: Progressive loading without page refreshes
- **Search Pagination**: Maintain filters during pagination
- **Load States**: Loading indicators and error handling

### 6. Comments & Ratings System
- **Recipe Comments**: Threaded commenting system
- **Star Ratings**: 1-5 star rating system
- **Rating Aggregation**: Average ratings calculation
- **Comment Moderation**: Admin can moderate comments
- **User Interaction**: Like/dislike comments
- **Spam Protection**: Basic spam detection

### 7. User Profiles & Social Features
- **User Profiles**: Public profile pages
- **Recipe Collections**: Users can save favorite recipes
- **User Activity**: Track user's submitted recipes
- **Follow System**: Users can follow other users
- **Recipe Sharing**: Social sharing capabilities

## API Endpoints Structure

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Token refresh
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Recipe Routes (`/api/recipes`)
- `GET /` - List recipes with pagination and filters
- `GET /:id` - Get single recipe
- `POST /` - Create new recipe (authenticated)
- `PUT /:id` - Update recipe (owner or admin)
- `DELETE /:id` - Delete recipe (owner or admin)
- `GET /search` - Search recipes
- `GET /categories` - Get recipe categories

### Admin Routes (`/api/admin`)
- `GET /recipes/pending` - Get pending recipes
- `POST /recipes/:id/approve` - Approve recipe
- `POST /recipes/:id/reject` - Reject recipe
- `GET /users` - List all users
- `PUT /users/:id/role` - Update user role

### Comments & Ratings (`/api/recipes/:id`)
- `GET /comments` - Get recipe comments
- `POST /comments` - Add comment
- `PUT /comments/:commentId` - Update comment
- `DELETE /comments/:commentId` - Delete comment
- `POST /rating` - Rate recipe
- `GET /rating` - Get user's rating for recipe

## Database Schema

### Users Table
```sql
- id (UUID, primary key)
- email (unique, not null)
- password_hash (not null)
- name (not null)
- role (enum: USER, ADMIN)
- avatar_url (optional)
- created_at, updated_at
```

### Recipes Table
```sql
- id (UUID, primary key)
- title (not null)
- description (text)
- ingredients (JSON)
- instructions (JSON)
- category_id (foreign key)
- difficulty (enum: EASY, MEDIUM, HARD)
- prep_time (integer, minutes)
- cook_time (integer, minutes)
- servings (integer)
- calories_per_serving (integer)
- protein, carbs, fat (decimal)
- image_url (optional)
- status (enum: PENDING, APPROVED, REJECTED)
- user_id (foreign key)
- approved_by (foreign key to users, optional)
- created_at, updated_at
```

### Categories Table
```sql
- id (UUID, primary key)
- name (unique, not null)
- description (optional)
- created_at, updated_at
```

### Comments Table
```sql
- id (UUID, primary key)
- recipe_id (foreign key)
- user_id (foreign key)
- content (text, not null)
- parent_id (foreign key, for replies)
- created_at, updated_at
```

### Ratings Table
```sql
- id (UUID, primary key)
- recipe_id (foreign key)
- user_id (foreign key)
- rating (integer, 1-5)
- created_at, updated_at
- unique(recipe_id, user_id)
```

## Security Features
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: Input sanitization
- **Rate Limiting**: API rate limiting middleware
- **CORS Configuration**: Proper CORS setup
- **Password Security**: Bcrypt hashing with salt
- **JWT Security**: Secure token generation and validation

## Performance Optimizations
- **Database Indexing**: Proper database indexes
- **Query Optimization**: Efficient Prisma queries
- **Caching Strategy**: Redis caching for frequently accessed data
- **Image Optimization**: Image compression and CDN integration
- **Pagination**: Cursor-based pagination for large datasets

## Development & Deployment
- **Hot Reload**: Development server with hot reload
- **Environment Configuration**: Multiple environment support
- **Docker Support**: Multi-stage Docker build
- **CI/CD Pipeline**: Automated testing and deployment
- **Health Checks**: API health monitoring endpoints
- **Logging**: Structured logging with different levels
- **Error Handling**: Comprehensive error handling and reporting

## Testing Strategy
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Database operation testing
- **Authentication Tests**: JWT and auth flow testing
- **Error Handling Tests**: Error scenario testing

This context provides a comprehensive overview of the FitRecipes Backend features and implementation details for GitHub Copilot to understand the project scope and generate relevant suggestions.