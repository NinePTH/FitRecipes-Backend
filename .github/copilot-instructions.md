# GitHub Copilot Repository Instructions – Backend

This repository contains the backend of the Healthy Recipes Web Application, developed using **Hono.js (TypeScript)** with **Supabase (PostgreSQL + Storage)** and **Prisma ORM**.  
Copilot should assist in building, testing, and maintaining backend features according to the SRS provided below.

## General Instructions
- Use **TypeScript** with Hono.js for REST APIs.
- Database & File Storage: **Supabase** (PostgreSQL + Storage).
- ORM: **Prisma**.
- Follow **modular architecture**: separate routes, controllers/services, models.
- Include **unit tests and integration tests**.
- CI/CD: backend should be containerized with Docker and deployable on Render.
- Scalability: configure **docker-compose** with service replicas to simulate horizontal scaling (until Kubernetes is adopted in the future).
- Security: sanitize inputs, hash passwords, manage sessions.
- Keep **placeholder endpoints** for Should-Have and Could-Have features (Notifications, Save Recipe, Reporting) but do not implement yet.

## APIs / Features

### 1. Authentication
- Register, Login, Password Reset, Logout.
- Validate email uniqueness, accept Terms & Conditions.
- Secure session creation and management.
- Limit failed login attempts and block temporarily.

### 2. Recipe Search
- Search by multiple ingredients with priority: all ingredients first, then partial matches.
- Support **1,000 concurrent users**.
- Return results within 3 seconds for up to 10 ingredients.

### 3. Recipe Browse and Recommendation
- Filter: Meal Type, Diet Type, Difficulty, Main Ingredient, Cuisine Type, Preparation Time.
- Sorting: Highest Rating, Most Recent, Preparation Time (asc/desc).
- Infinite scroll pagination.
- Personalized recommendations: "Recommended for You", Trending, New Recipes.
- Response structure: `{ status, data, errors }`.
- Cache trending/popular recipes for faster load.

### 4. Recipe Submission
- Accessible only to Chef role.
- Validate all required fields before submission.
- Support edit, cancel, resubmit for rejected recipes.
- Response: `{ status, message, recipe }`.

### 5. Recipe Approval System
- Admin only endpoints: approve/reject recipes.
- Include rejection reason in response.
- Infinite scroll pagination for pending recipes.

### 6. Community Engagement
- Comment and Rating:
  - One rating per user per recipe.
  - Allow update/remove rating.
  - Auto-recalculate average rating.
- Input sanitization for security.

## Non-Functional Requirements
- Performance: endpoints should respond within 2–5 seconds.
- Scalability: support at least 1,000 concurrent users for search and recommendation.
- Maintainability: modular, testable services.
- Security: sanitize all user inputs, protect user data, session management.
- CI/CD: ready for automated build, test, and deploy.
- Infrastructure: database and storage hosted on **Supabase**, backend service can be replicated via **docker-compose** (future migration path to Kubernetes).
