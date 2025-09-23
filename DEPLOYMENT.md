# FitRecipes Backend Deployment Guide

This guide covers various deployment options for the FitRecipes Backend.

## Prerequisites

- Docker and Docker Compose
- PostgreSQL database
- Node.js 18+ (for local development)

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (use a strong, random value)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)

## Local Development

### With Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/NinePTH/FitRecipes-Backend.git
cd FitRecipes-Backend
```

2. Start the services:
```bash
docker-compose up -d
```

3. Initialize the database:
```bash
# Generate Prisma client
docker-compose exec app npx prisma generate

# Run migrations
docker-compose exec app npx prisma db push

# Seed the database (optional)
docker-compose exec app npm run db:seed
```

4. Access the API at `http://localhost:3000`

### Without Docker

1. Install dependencies:
```bash
npm install
```

2. Set up PostgreSQL database and update `.env`

3. Initialize database:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Start development server:
```bash
npm run dev
```

## Production Deployment

### Docker Production Build

1. Build the production image:
```bash
docker build -t fitrecipes-backend:latest .
```

2. Run the container:
```bash
docker run -d \
  --name fitrecipes-backend \
  -p 3000:3000 \
  --env-file .env \
  fitrecipes-backend:latest
```

### Docker Compose Production

1. Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  app:
    image: fitrecipes-backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

2. Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Cloud Deployment

### AWS ECS

1. Build and push to ECR:
```bash
# Create ECR repository
aws ecr create-repository --repository-name fitrecipes-backend

# Build and tag image
docker build -t fitrecipes-backend .
docker tag fitrecipes-backend:latest {account-id}.dkr.ecr.{region}.amazonaws.com/fitrecipes-backend:latest

# Push to ECR
docker push {account-id}.dkr.ecr.{region}.amazonaws.com/fitrecipes-backend:latest
```

2. Create ECS service with RDS PostgreSQL database

### Google Cloud Run

1. Build and push to Container Registry:
```bash
# Build for Cloud Run
docker build -t gcr.io/{project-id}/fitrecipes-backend .

# Push to registry
docker push gcr.io/{project-id}/fitrecipes-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy fitrecipes-backend \
  --image gcr.io/{project-id}/fitrecipes-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production,JWT_SECRET=${JWT_SECRET} \
  --set-env-vars DATABASE_URL=${DATABASE_URL}
```

### Heroku

1. Create `Procfile`:
```
web: npm start
```

2. Deploy:
```bash
# Install Heroku CLI
heroku create fitrecipes-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma db push
heroku run npm run db:seed
```

## Database Setup

### PostgreSQL

1. Create database:
```sql
CREATE DATABASE fitrecipes;
CREATE USER fitrecipes_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fitrecipes TO fitrecipes_user;
```

2. Update `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://fitrecipes_user:your_password@localhost:5432/fitrecipes"
```

### Migrations

After deployment, run database migrations:
```bash
# Generate Prisma client
npx prisma generate

# Apply schema changes
npx prisma db push

# Or use migrations (recommended for production)
npx prisma migrate deploy
```

## SSL/TLS Configuration

### Nginx Reverse Proxy

1. Install Nginx and Certbot

2. Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Logging

### Health Checks

The application provides health check endpoints:
- `GET /api/health` - Application health
- Docker health checks built into the container

### Logs

Application logs are written to stdout/stderr and can be viewed with:
```bash
# Docker
docker logs fitrecipes-backend

# Docker Compose
docker-compose logs -f app

# Production logs
journalctl -u fitrecipes-backend -f
```

### Monitoring Setup

1. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/index.js --name fitrecipes-backend
pm2 startup
pm2 save
```

2. Set up monitoring with PM2:
```bash
pm2 monitor
```

## Backup and Recovery

### Database Backup

1. Create backup script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
```

2. Automate backups with cron:
```bash
0 2 * * * /path/to/backup-script.sh
```

### Recovery

```bash
# Restore from backup
psql $DATABASE_URL < backup_file.sql

# Reset database and re-run migrations
npm run db:reset
npm run db:seed
```

## Performance Optimization

### Database

1. Add indexes for frequently queried fields
2. Use connection pooling
3. Configure PostgreSQL for production

### Application

1. Enable compression in reverse proxy
2. Use Redis for caching (future enhancement)
3. Configure rate limiting appropriately
4. Use CDN for static assets

## Security Checklist

- [ ] Use strong JWT secret
- [ ] Enable HTTPS in production
- [ ] Configure CORS appropriately
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated
- [ ] Configure firewall rules
- [ ] Use non-root user in Docker container
- [ ] Regular security audits

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity

2. **JWT token invalid**
   - Ensure JWT_SECRET is set
   - Check token expiration
   - Verify token format

3. **Port already in use**
   - Change PORT environment variable
   - Kill existing process

4. **Prisma client not generated**
   - Run `npx prisma generate`
   - Ensure schema.prisma is valid

### Debug Mode

Enable debug logging:
```bash
export NODE_ENV=development
export DEBUG=*
```

### Health Check

Test the application:
```bash
curl http://localhost:3000/api/health
```