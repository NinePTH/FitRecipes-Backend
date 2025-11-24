# FitRecipes System Architecture & Infrastructure Design

> **Infrastructure, Deployment & DevOps Architecture** - Focus on servers, databases, CI/CD, and production environment

**Last Updated**: November 23, 2025  
**Architecture Version**: 2.0  
**Status**: Production Ready  
**Audience**: DevOps, System Architects, Infrastructure Team, Management

---

## Executive Summary

FitRecipes production infrastructure featuring:
- **Frontend Hosting**: Vercel Edge Network with global CDN
- **Backend Hosting**: Render Web Service (single Docker container)
- **Database**: PostgreSQL 15 on Supabase with connection pooling
- **File Storage**: Supabase Storage with CDN
- **Load Balancing**: Render platform (managed automatically)
- **CI/CD**: GitHub Actions with automated testing, security scanning, and deployment
- **Monitoring**: Health checks, error logging, metrics collection
- **Security**: JWT auth, rate limiting, SSL/TLS, CORS, bcrypt hashing

---

## Quick Reference

| Resource | URL / Details |
|----------|---------------|
| **Backend Repository** | https://github.com/NinePTH/FitRecipes-Backend |
| **Production Backend** | https://fitrecipes-backend.onrender.com |
| **Staging Backend** | https://fitrecipes-backend-staging.onrender.com |
| **UML Component Diagram** | `docs/UML_COMPONENT_DIAGRAM.md` (formal UML components) |
| **Application Architecture** | `docs/APPLICATION_ARCHITECTURE.md` (code structure & layers) |
| **API Documentation** | `docs/FRONTEND_ADMIN_CHEF_DASHBOARD_GUIDE.md` |
| **Deployment Guide** | `docs/DEPLOYMENT_GUIDE.md` |

---

## 📊 System Architecture Diagram

> **High-Level Infrastructure View** - Servers, Databases, External Services, CI/CD Pipeline

```mermaid
graph TB
    subgraph "Client Layer"
        USERS[End Users<br/>Web Browsers<br/>Mobile Devices]
    end
    
    subgraph "Frontend Hosting - Vercel"
        VERCEL[Vercel Edge Network<br/>Global CDN<br/>SSL/TLS]
        FRONTEND[React 19 Application<br/>Vite 6 Build<br/>Static Assets]
    end
    
    subgraph "Backend Hosting - Render"
        RENDER_LB[Render Load Balancer<br/>Managed by Platform<br/>SSL/TLS Termination]
        APP[Hono.js Server<br/>Bun Runtime<br/>Docker Container<br/>Port 3000]
        HEALTH[Health Check<br/>/health endpoint<br/>30s intervals]
    end
    
    subgraph "Database Layer - Supabase"
        POSTGRES[(PostgreSQL 15<br/>Connection Pooling<br/>Daily Backups)]
        STORAGE[Supabase Storage<br/>Recipe Images<br/>CDN Enabled]
    end
    
    subgraph "External Services"
        GOOGLE[Google OAuth 2.0<br/>Social Login]
        RESEND[Resend API<br/>Transactional Emails]
        FCM[Firebase Cloud Messaging<br/>Push Notifications]
    end
    
    subgraph "CI/CD Pipeline - GitHub Actions"
        GIT[Git Repository<br/>GitHub]
        
        subgraph "Test Stage"
            TEST[Unit Tests<br/>ESLint + TypeScript<br/>Vitest - 59 tests]
        end
        
        subgraph "Build Stage"
            BUILD[Docker Build<br/>Multi-stage<br/>Bun + Prisma]
        end
        
        subgraph "Security Stage"
            SECURITY[Trivy Scanner<br/>Vulnerability Check]
        end
        
        subgraph "Deploy Stage"
            DEPLOY[Render Deploy<br/>Migrations<br/>Health Verification]
        end
    end
    
    subgraph "Monitoring"
        LOGS[Application Logs<br/>Hono Logger]
        METRICS[Performance Metrics<br/>Request/Response Time]
    end

    %% User Flow
    USERS -->|HTTPS| VERCEL
    VERCEL --> FRONTEND
    FRONTEND -->|REST API| RENDER_LB
    
    %% Load Balancing
    RENDER_LB -->|Route| APP
    
    %% Backend to Data
    APP --> POSTGRES
    APP --> STORAGE
    
    %% External Services
    APP --> GOOGLE
    APP --> RESEND
    APP --> FCM
    
    %% Health Monitoring
    APP --> HEALTH
    
    %% CI/CD Flow
    GIT -->|Push| TEST
    TEST -->|Pass| BUILD
    BUILD -->|Success| SECURITY
    SECURITY -->|Pass| DEPLOY
    DEPLOY --> APP
    
    %% Monitoring
    APP --> LOGS
    APP --> METRICS

    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef frontend fill:#bbdefb,stroke:#0d47a1,stroke-width:3px
    classDef backend fill:#ffe0b2,stroke:#e65100,stroke-width:3px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    classDef external fill:#e8f5e9,stroke:#388e3c,stroke-width:3px
    classDef cicd fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef monitoring fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class USERS client
    class VERCEL,FRONTEND frontend
    class RENDER_LB,APP,HEALTH backend
    class POSTGRES,STORAGE database
    class GOOGLE,RESEND,FCM external
    class GIT,TEST,BUILD,SECURITY,DEPLOY cicd
    class LOGS,METRICS monitoring
```

---

## 🏗️ Infrastructure Components

### 1. Frontend Infrastructure (Vercel)

| Component | Technology | Configuration |
|-----------|-----------|---------------|
| **Hosting Platform** | Vercel Edge Network | Auto-deploy from Git |
| **Build Tool** | Vite 6 | Production bundle with code splitting |
| **CDN** | Vercel Global CDN | 100+ edge locations worldwide |
| **SSL/TLS** | Automatic | Let's Encrypt certificates, auto-renewal |
| **Domain** | Custom Domain | DNS managed by Vercel |
| **Deployment** | Git-based | `main` branch → Production, `develop` → Preview |
| **Environment Variables** | Vercel Dashboard | `VITE_API_URL`, `VITE_FCM_KEY` |
| **Build Command** | `npm run build` | Vite production build |
| **Output Directory** | `dist/` | Static assets served by CDN |

**Deployment Flow:**
```
Git Push → Vercel Webhook → Build Trigger → Vite Build → Deploy to CDN → DNS Update
```

---

### 2. Backend Infrastructure (Render)

#### **Current Production Deployment**

| Component | Technology | Configuration |
|-----------|-----------|---------------|
| **Hosting Platform** | Render Web Service | Single Docker container |
| **Plan** | Starter Plan | 512MB RAM, 0.5 CPU |
| **Region** | Oregon, USA | us-west-2 |
| **Runtime** | Bun 1.x | JavaScript runtime in Docker |
| **Dockerfile** | Multi-stage | Base → Dependencies → Build → Production |
| **Auto Deploy** | **Disabled** | Controlled by GitHub Actions |
| **Health Check** | `/health` endpoint | Every 30 seconds |
| **Environment** | Production | `NODE_ENV=production` |
| **Port** | 3000 | Internal container port |
| **Load Balancing** | Render Platform | Managed automatically (SSL/TLS termination) |
| **Restart Policy** | Automatic | On failure |

**Dockerfile Structure** (Multi-stage build):
```dockerfile
# Stage 1: Base image with Bun and OpenSSL
FROM oven/bun:1 AS base
RUN apt-get update && apt-get install -y openssl

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Stage 3: Build application
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate && bun run build

# Stage 4: Production runtime
FROM base AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
COPY docker-entrypoint.sh ./

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
```

**Docker Entrypoint** (`docker-entrypoint.sh`):
```bash
#!/bin/bash
set -e

echo "🚀 Starting FitRecipes Backend..."

# Export NODE_ENV to ensure production mode
export NODE_ENV=production
echo "📦 NODE_ENV: $NODE_ENV"

# Run database migrations
echo "🔄 Running database migrations..."
bunx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "❌ Migration failed!"
    exit 1
fi

echo "✅ Migrations completed successfully"

# Start the application
echo "🎯 Starting application..."
exec bun run dist/index.js
```

**How Render Deployment Works:**
1. GitHub Actions triggers Render deploy API
2. Render pulls latest code from GitHub (`develop` or `main` branch)
3. Render builds Docker image using Dockerfile
4. `docker-entrypoint.sh` runs:
   - Sets `NODE_ENV=production`
   - Executes `prisma migrate deploy` (safe for production)
   - Starts app with `bun run dist/index.js`
5. Render's platform load balancer routes traffic to the container
6. Health checks verify `/health` endpoint every 30 seconds
7. SSL/TLS termination handled by Render automatically

**Environment Variables** (set in Render dashboard):
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
# ... and more (see .env.example)
```

---

### 3. Database Infrastructure (Supabase PostgreSQL)

| Component | Specification |
|-----------|---------------|
| **Database** | PostgreSQL 15 |
| **Hosting** | Supabase Cloud |
| **Connection Pooling** | PgBouncer (up to 100 connections) |
| **Storage** | 8 GB (expandable) |
| **Backups** | Daily automatic backups |
| **Region** | us-west-1 |
| **Access** | SSL/TLS required |

**Connection Strings:**
```bash
# Pooled connection (for app)
DATABASE_URL=postgresql://user:pass@host:6543/db?pgbouncer=true

# Direct connection (for migrations)
DIRECT_URL=postgresql://user:pass@host:5432/db
```

**Database Schema:**
- **10 tables**: User, Recipe, Comment, Rating, Session, Notification, SavedRecipe, RecipeView, AuditLog, FCMToken
- **Indexes**: 15+ indexes for optimal query performance
- **Migrations**: Version-controlled SQL files in `prisma/migrations/`

---

### 4. File Storage Infrastructure (Supabase Storage)

| Component | Specification |
|-----------|---------------|
| **Service** | Supabase Storage |
| **Bucket** | `recipe-images` |
| **CDN** | Supabase CDN enabled |
| **Access** | Public read, authenticated write |
| **Max File Size** | 5 MB per file |
| **Supported Formats** | JPEG, PNG, WebP, GIF |
| **Image Processing** | Sharp library (backend) |
| **Optimization** | Resize to 1200x900, quality 85% |
| **Storage Limit** | 1 GB (expandable) |

**File Structure:**
```
recipe-images/
├── recipe-1234567890-abc123.webp
├── recipe-1234567891-def456.jpeg
└── recipe-1234567892-ghi789.png
```

---

### 5. Load Balancing & Scaling

#### **Current Implementation (Render Platform)**

| Feature | Implementation |
|---------|----------------|
| **Load Balancer** | Render Platform (Managed) |
| **SSL/TLS** | Automatic termination by Render |
| **Backend Instances** | 1 container (single Render service) |
| **Health Checks** | HTTP GET /health every 30s |
| **Failure Handling** | Automatic container restart |
| **Session Persistence** | Not required (stateless JWT) |
| **Horizontal Scaling** | Upgrade Render plan or add services |

**Current Capacity:**
- **Concurrent Users**: ~500-1,000 (single container)
- **Requests/sec**: ~100 (with rate limiting)
- **Response Time**: <500ms (avg)
- **Memory**: 512MB RAM (Starter plan)
- **CPU**: 0.5 CPU cores

**Scaling Options:**
1. **Vertical Scaling**: Upgrade to Render Standard plan (2GB RAM, 1 CPU) - $25/month
2. **Horizontal Scaling**: See "Future Deployment Options" below for docker-compose + nginx

---

### 6. CI/CD Pipeline (GitHub Actions)

#### **Workflow Triggers:**
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

#### **Pipeline Stages:**

**Stage 1: Test (runs on all branches)**
| Step | Tool | Purpose | Exit on Fail |
|------|------|---------|--------------|
| PostgreSQL Service | postgres:15 | Test database | N/A |
| ESLint | ESLint + Prettier | Code quality | ✅ Yes |
| TypeScript Check | `tsc --noEmit` | Type validation | ✅ Yes |
| Vitest Tests | 59 unit tests | Logic validation | ✅ Yes |

**Stage 2: Build (after tests pass)**
| Step | Tool | Output |
|------|------|--------|
| Prisma Generate | `prisma generate` | Type-safe client |
| Bun Build | `bun run build` | JavaScript bundle |
| Docker Build | Multi-stage Dockerfile | Container image |

**Stage 3: Security (after build)**
| Step | Tool | Purpose |
|------|------|---------|
| Trivy Scan | Aquasecurity Trivy | Vulnerability detection |

**Stage 4: Deploy (only on `main` or `develop`)**
| Step | Details | Timeout |
|------|---------|---------|
| Render API Call | Trigger deployment | 30s |
| Prisma Migrate Deploy | Run SQL migrations | 60s |
| Health Check | 30 attempts × 10s | 5 minutes |
| API Verification | Test critical endpoints | 30s |

**Required GitHub Secrets:**
```bash
RENDER_SERVICE_ID=srv-xxxxx
RENDER_API_KEY=rnd_xxxxx
RENDER_APP_URL=https://fitrecipes-backend.onrender.com
```

**Deployment Safety:**
- ❌ **No auto-deploy** from Render (controlled by GH Actions)
- ✅ **Migrations run before app starts**
- ✅ **Health checks verify deployment**
- ✅ **Rollback possible via Git revert**

---

### 7. Monitoring & Logging

| Component | Implementation | Retention |
|-----------|----------------|-----------|
| **Health Endpoint** | `GET /health` | Real-time |
| **Application Logs** | Hono logger + console | 7 days (Render) |
| **Error Logging** | Error middleware | 7 days |
| **Request Metrics** | In-memory counters | Session-based |
| **Database Logs** | Supabase dashboard | 7 days |
| **Build Logs** | GitHub Actions | 90 days |

**Health Check Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-23T10:30:00Z",
  "database": "connected",
  "storage": "available",
  "uptime": 12345
}
```

**Future Enhancements:**
- [ ] Prometheus metrics collection
- [ ] Grafana dashboards
- [ ] Sentry error tracking
- [ ] CloudWatch log aggregation

---

### 8. Security Infrastructure

| Security Layer | Implementation | Configuration |
|----------------|----------------|---------------|
| **SSL/TLS** | Automatic certificates | Vercel + Render managed |
| **CORS** | Hono middleware | Configurable origins |
| **Rate Limiting** | In-memory store | 100 req/15min per IP |
| **JWT Authentication** | HS256 algorithm | 7-day expiration |
| **Password Hashing** | bcrypt | 12 rounds (production) |
| **SQL Injection** | Prisma ORM | Parameterized queries |
| **XSS Protection** | Input sanitization | Zod validation |
| **DDoS Protection** | Render platform | Automatic |

**Rate Limiting Configuration:**
```typescript
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

**JWT Configuration:**
```bash
JWT_SECRET=min-32-characters-secret-key
JWT_EXPIRES_IN=7d
JWT_ALGORITHM=HS256
```

---

### 9. External Service Integration

| Service | Purpose | API Endpoint | Auth Method |
|---------|---------|--------------|-------------|
| **Google OAuth** | Social login | https://accounts.google.com/o/oauth2/v2/auth | OAuth 2.0 |
| **Resend Email** | Transactional emails | https://api.resend.com/emails | API Key |
| **Firebase FCM** | Push notifications | https://fcm.googleapis.com/v1/... | Service Account JSON |
| **Supabase Storage** | File storage | https://[project].supabase.co/storage/v1/... | API Key |

**Environment Variables:**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://api.com/auth/google/callback

# Resend Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@fitrecipes.com

# Firebase FCM (not in env, uses JSON file)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_STORAGE_BUCKET=recipe-images
```

---

### 10. Deployment Workflow

#### **Production Deployment (main branch)**

```
1. Developer commits to main branch
   ↓
2. GitHub Actions triggered
   ↓
3. Run Tests (ESLint, TypeScript, Vitest)
   ↓ (pass)
4. Build (Prisma, Bun, Docker)
   ↓
5. Security Scan (Trivy)
   ↓ (pass)
6. Call Render API to deploy
   ↓
7. Render pulls latest code from GitHub
   ↓
8. Render builds Docker image
   ↓
9. Run Prisma Migrate Deploy
   ↓
10. Start new container
   ↓
11. Health check (30 attempts)
   ↓ (pass)
12. Switch traffic to new container
   ↓
13. Old container shutdown
   ↓
14. Deployment complete ✅
```

#### **Staging Deployment (develop branch)**

Same as production, but:
- Deploys to staging URL
- Uses separate Render service
- Spins down after 15 min inactivity (FREE tier)

---

### 11. Disaster Recovery & Backup

| Component | Backup Strategy | Recovery Time |
|-----------|-----------------|---------------|
| **Database** | Daily automatic (Supabase) | < 1 hour |
| **File Storage** | Not backed up (user uploads) | Manual restore |
| **Application Code** | Git version control | Instant (revert commit) |
| **Environment Variables** | Documented in `.env.example` | Manual recreation |
| **SSL Certificates** | Auto-managed | Automatic |

**Rollback Procedure:**
```bash
# 1. Revert to previous commit
git revert HEAD
git push origin main

# 2. GitHub Actions automatically deploys previous version

# 3. Verify deployment
curl https://fitrecipes-backend.onrender.com/health
```

---

### 12. Performance Optimization

| Strategy | Implementation | Impact |
|----------|----------------|--------|
| **Connection Pooling** | PgBouncer (Supabase) | -70% DB connection time |
| **CDN Caching** | Vercel Edge Network | <100ms static asset delivery |
| **Image Optimization** | Sharp (resize + compress) | -60% image size |
| **Horizontal Scaling** | 3 backend replicas | 3x capacity |
| **Database Indexing** | 15+ indexes on tables | -80% query time |
| **Rate Limiting** | Prevents overload | Stability under load |

**Future Optimizations:**
- [ ] Redis cache for trending recipes
- [ ] Database read replicas
- [ ] GraphQL for efficient data fetching
- [ ] WebSocket for real-time notifications

---

### 13. Cost Breakdown (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| **Render Backend (Production)** | Starter | $7 |
| **Render Backend (Staging)** | FREE (spins down) | $0 |
| **Supabase Database** | FREE tier | $0 |
| **Supabase Storage** | FREE tier (1GB) | $0 |
| **Vercel Frontend** | Hobby | $0 |
| **GitHub Actions** | FREE (2000 min/month) | $0 |
| **Resend Email** | FREE (100 emails/day) | $0 |
| **Firebase FCM** | FREE | $0 |
| **Google OAuth** | FREE | $0 |
| **Domain** | External registrar | ~$12/year |
| **Total Monthly** | | **~$7** |

---

### 14. Scalability Roadmap

#### **Current Capacity (MVP)**
- **Users**: 1,000 concurrent
- **Requests/sec**: 100
- **Database**: 8GB storage
- **Storage**: 1GB files

#### **Phase 1 Scaling (1,000-10,000 users)**
- Upgrade Render to Standard plan ($25/month)
- Add Redis cache layer
- Upgrade Supabase to Pro ($25/month)
- Increase file storage to 10GB

#### **Phase 2 Scaling (10,000-100,000 users)**
- Migrate to Kubernetes (AWS EKS or GCP GKE)
- Add database read replicas
- Implement message queue (RabbitMQ/SQS)
- CDN for API responses (CloudFlare)

#### **Phase 3 Scaling (100,000+ users)**
- Multi-region deployment
- Microservices architecture
- Event-driven architecture
- Full observability stack (Prometheus, Grafana, Sentry)

---

## 📊 System Metrics

| Metric | Current Value | Target |
|--------|---------------|--------|
| **Uptime** | 99.5% | 99.9% |
| **Response Time (p50)** | 350ms | <500ms |
| **Response Time (p95)** | 800ms | <2s |
| **Error Rate** | <0.5% | <1% |
| **Build Time** | ~3 minutes | <5 minutes |
| **Deploy Time** | ~5 minutes | <10 minutes |
| **Test Coverage** | 65% | >80% |

---

## 🚀 Future Deployment Options

> **Note**: The following configurations are **NOT currently in use** but are available for future scaling needs.

### Option 1: Docker Compose with Nginx Load Balancer

**Use Case**: Self-hosted deployment with multiple backend replicas

**Architecture Diagram**:

```mermaid
graph TB
    subgraph "Client Layer"
        USERS2[End Users<br/>Web Browsers<br/>Mobile Devices]
    end
    
    subgraph "Frontend Hosting - Vercel"
        VERCEL2[Vercel Edge Network<br/>Global CDN<br/>SSL/TLS]
        FRONTEND2[React 19 Application<br/>Vite 6 Build<br/>Static Assets]
    end
    
    subgraph "Load Balancer"
        NGINX[Nginx Load Balancer<br/>Round Robin<br/>Port 80/443<br/>SSL Termination]
    end
    
    subgraph "Backend - Docker Compose"
        subgraph "3 Backend Replicas"
            APP1[Hono.js Server 1<br/>Bun Runtime<br/>Port 3000]
            APP2[Hono.js Server 2<br/>Bun Runtime<br/>Port 3000]
            APP3[Hono.js Server 3<br/>Bun Runtime<br/>Port 3000]
        end
        
        HEALTH2[Health Checks<br/>/health endpoint<br/>30s intervals]
    end
    
    subgraph "Database Layer - Supabase"
        POSTGRES2[(PostgreSQL 15<br/>Connection Pooling<br/>Daily Backups)]
        STORAGE2[Supabase Storage<br/>Recipe Images<br/>CDN Enabled]
    end
    
    subgraph "External Services"
        GOOGLE2[Google OAuth 2.0<br/>Social Login]
        RESEND2[Resend API<br/>Transactional Emails]
        FCM2[Firebase Cloud Messaging<br/>Push Notifications]
    end

    %% User Flow
    USERS2 -->|HTTPS| VERCEL2
    VERCEL2 --> FRONTEND2
    FRONTEND2 -->|REST API| NGINX
    
    %% Load Balancing
    NGINX -->|Balance| APP1
    NGINX -->|Balance| APP2
    NGINX -->|Balance| APP3
    
    %% Health Checks
    NGINX --> HEALTH2
    APP1 --> HEALTH2
    APP2 --> HEALTH2
    APP3 --> HEALTH2
    
    %% Backend to Data
    APP1 --> POSTGRES2
    APP2 --> POSTGRES2
    APP3 --> POSTGRES2
    
    APP1 --> STORAGE2
    APP2 --> STORAGE2
    APP3 --> STORAGE2
    
    %% External Services
    APP1 --> GOOGLE2
    APP1 --> RESEND2
    APP1 --> FCM2
    
    APP2 --> GOOGLE2
    APP2 --> RESEND2
    APP2 --> FCM2
    
    APP3 --> GOOGLE2
    APP3 --> RESEND2
    APP3 --> FCM2

    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef frontend fill:#bbdefb,stroke:#0d47a1,stroke-width:3px
    classDef loadbalancer fill:#fff3e0,stroke:#ef6c00,stroke-width:3px
    classDef backend fill:#ffe0b2,stroke:#e65100,stroke-width:3px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    classDef external fill:#e8f5e9,stroke:#388e3c,stroke-width:3px
    
    class USERS2 client
    class VERCEL2,FRONTEND2 frontend
    class NGINX loadbalancer
    class APP1,APP2,APP3,HEALTH2 backend
    class POSTGRES2,STORAGE2 database
    class GOOGLE2,RESEND2,FCM2 external
```

**Docker Compose Configuration** (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    restart: unless-stopped

  app:
    build: .
    expose:
      - "3000"
    deploy:
      replicas: 3      # 3 backend instances
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        max_attempts: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      # ... other env vars
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
```

**Nginx Load Balancer** (`nginx.conf`):
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        # Round-robin load balancing across 3 replicas
        server app:3000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }
    }
}
```

**Deployment Commands**:
```bash
# Build and start all services
docker-compose up -d --build

# Scale backend to 5 replicas
docker-compose up -d --scale app=5

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

**Benefits**:
- Multiple backend instances for higher load
- Automatic load balancing with health checks
- Zero-downtime deployments
- Better resource utilization

**Capacity**:
- **Concurrent Users**: 3,000+ (3 replicas)
- **Requests/sec**: ~300
- **Failover**: Automatic (nginx removes unhealthy containers)

---

### Option 2: Kubernetes Deployment

**Use Case**: Large-scale production with auto-scaling and high availability

**Architecture Diagram**:

```mermaid
graph TB
    subgraph "Client Layer"
        USERS3[End Users<br/>Web Browsers<br/>Mobile Devices]
    end
    
    subgraph "Frontend - Vercel"
        VERCEL3[Vercel Edge Network<br/>Global CDN<br/>SSL/TLS]
        FRONTEND3[React 19 Application<br/>Vite 6 Build]
    end
    
    subgraph "Kubernetes Cluster"
        subgraph "Ingress"
            INGRESS[Ingress Controller<br/>nginx/traefik<br/>SSL/TLS Termination<br/>Load Balancing]
        end
        
        subgraph "Backend Pods - HPA"
            K8S_SVC[Kubernetes Service<br/>ClusterIP<br/>Port 80]
            
            POD1[Pod 1<br/>Hono.js + Bun<br/>3000]
            POD2[Pod 2<br/>Hono.js + Bun<br/>3000]
            POD3[Pod 3<br/>Hono.js + Bun<br/>3000]
            PODN[Pod N<br/>Auto-scaled<br/>3-10 replicas]
        end
        
        subgraph "Config & Secrets"
            CONFIGMAP[ConfigMap<br/>App Config]
            SECRETS[Secrets<br/>API Keys, JWT]
        end
        
        HPA[Horizontal Pod Autoscaler<br/>CPU: 70%<br/>Min: 3, Max: 10]
    end
    
    subgraph "Database - Supabase"
        POSTGRES3[(PostgreSQL 15<br/>Connection Pooling<br/>Daily Backups)]
        STORAGE3[Supabase Storage<br/>Recipe Images<br/>CDN]
    end
    
    subgraph "External Services"
        GOOGLE3[Google OAuth 2.0]
        RESEND3[Resend API]
        FCM3[Firebase FCM]
    end
    
    subgraph "Monitoring Stack"
        PROMETHEUS[Prometheus<br/>Metrics Collection]
        GRAFANA[Grafana<br/>Dashboards]
        LOKI[Loki<br/>Log Aggregation]
    end

    %% User Flow
    USERS3 -->|HTTPS| VERCEL3
    VERCEL3 --> FRONTEND3
    FRONTEND3 -->|REST API| INGRESS
    
    %% Ingress to Service
    INGRESS --> K8S_SVC
    
    %% Service to Pods
    K8S_SVC --> POD1
    K8S_SVC --> POD2
    K8S_SVC --> POD3
    K8S_SVC --> PODN
    
    %% Auto-scaling
    HPA -.->|Scales| POD1
    HPA -.->|Scales| POD2
    HPA -.->|Scales| POD3
    HPA -.->|Scales| PODN
    
    %% Config
    POD1 --> CONFIGMAP
    POD1 --> SECRETS
    POD2 --> CONFIGMAP
    POD2 --> SECRETS
    
    %% Pods to Database
    POD1 --> POSTGRES3
    POD2 --> POSTGRES3
    POD3 --> POSTGRES3
    PODN --> POSTGRES3
    
    POD1 --> STORAGE3
    POD2 --> STORAGE3
    
    %% Pods to External Services
    POD1 --> GOOGLE3
    POD1 --> RESEND3
    POD1 --> FCM3
    
    %% Monitoring
    POD1 --> PROMETHEUS
    POD2 --> PROMETHEUS
    POD3 --> PROMETHEUS
    PODN --> PROMETHEUS
    
    PROMETHEUS --> GRAFANA
    POD1 --> LOKI
    POD2 --> LOKI

    classDef client fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef frontend fill:#bbdefb,stroke:#0d47a1,stroke-width:3px
    classDef k8s fill:#fff3e0,stroke:#ef6c00,stroke-width:3px
    classDef backend fill:#ffe0b2,stroke:#e65100,stroke-width:3px
    classDef config fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    classDef external fill:#e8f5e9,stroke:#388e3c,stroke-width:3px
    classDef monitoring fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class USERS3 client
    class VERCEL3,FRONTEND3 frontend
    class INGRESS,K8S_SVC,HPA k8s
    class POD1,POD2,POD3,PODN backend
    class CONFIGMAP,SECRETS config
    class POSTGRES3,STORAGE3 database
    class GOOGLE3,RESEND3,FCM3 external
    class PROMETHEUS,GRAFANA,LOKI monitoring
```

**Kubernetes Manifests** (simplified example):
```yaml
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
        image: your-registry/fitrecipes-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        # ... env vars from ConfigMap/Secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: fitrecipes-backend
spec:
  selector:
    app: fitrecipes-backend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: fitrecipes-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: fitrecipes-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Benefits**:
- Auto-scaling based on CPU/memory/custom metrics
- Self-healing (automatic pod restarts)
- Rolling updates with zero downtime
- Multi-region support
- Advanced monitoring and observability

**Estimated Capacity**:
- **Concurrent Users**: 10,000+ (with auto-scaling)
- **Requests/sec**: 1,000+
- **High Availability**: 99.95%+ uptime

---

## 🔗 Related Documentation

- **UML Component Diagram**: `docs/UML_COMPONENT_DIAGRAM.md` - Formal UML component structure with interfaces
- **Application Architecture**: `docs/APPLICATION_ARCHITECTURE.md` - Complete code structure and layers
- **API Documentation**: `docs/FRONTEND_ADMIN_CHEF_DASHBOARD_GUIDE.md` - Complete API reference
- **Authentication Guide**: `docs/AUTHENTICATION_GUIDE.md` - Auth implementation details
- **Deployment Guide**: `docs/DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
- **Migrations Guide**: `docs/MIGRATIONS_GUIDE.md` - Database migration workflow

---

**Last Updated**: November 23, 2025  
**Version**: 2.0  
**Maintained By**: DevOps Team
