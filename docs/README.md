# FitRecipes Backend Documentation

Welcome to the FitRecipes Backend documentation! This directory contains comprehensive guides for development, deployment, and troubleshooting.

---

## 📚 Main Guides

### 🔐 [Authentication Guide](AUTHENTICATION_GUIDE.md)
**Complete authentication implementation reference**

Covers:
- Email/password registration and login
- Google OAuth 2.0 integration
- Email verification flow
- Password reset functionality
- Terms of Service acceptance
- Consistent response format across all endpoints
- Frontend integration examples

**When to use**: Building auth features, troubleshooting auth issues, integrating frontend authentication

---

### 🚀 [Deployment Guide](DEPLOYMENT_GUIDE.md)
**Complete deployment and operations manual**

Covers:
- Render deployment (Production & Staging)
- Environment configuration
- Database migrations
- Docker containerization
- CI/CD pipeline
- Monitoring & health checks
- Troubleshooting deployment issues
- Performance optimization

**When to use**: Deploying to Render, setting up environments, troubleshooting deployments, scaling

---

### ✉️ [Email Verification Guide](EMAIL_VERIFICATION_GUIDE.md)
**Email verification implementation**

Covers:
- Email verification flow
- API endpoints
- Frontend integration (React examples)
- Email templates
- Token security
- Troubleshooting email issues

**When to use**: Implementing email verification on frontend, debugging verification issues

---

### 🗄️ [Migrations Guide](MIGRATIONS_GUIDE.md)
**Prisma database migrations**

Covers:
- Creating migrations
- Applying migrations in development/production
- Migration workflow
- Common migration issues
- Why migrations must be in git

**When to use**: Making database schema changes, troubleshooting migration errors

---

## 📋 Quick References

### 🌐 [Deployment URLs](DEPLOYMENT_URLS.md)
Quick reference for all environment URLs (Production, Staging, Local)

---

## 🔧 Troubleshooting Guides

### ⚠️ [Fix Staging Migration Baseline](FIX_STAGING_MIGRATION_BASELINE.md)
**How to fix P3005 "Database schema is not empty" error**

Use when: Database has tables but no migration history

---

### 📦 [Migrations Must Be In Git](MIGRATIONS_MUST_BE_IN_GIT.md)
**Critical: Why migrations must be version-controlled**

Use when: Understanding why migrations fail on deployment

---

## 🗂️ Documentation Organization

### Recently Removed (Consolidated into Main Guides):
- `AUTH_ENDPOINTS_CONSISTENCY.md` → Merged into `AUTHENTICATION_GUIDE.md`
- `AUTH_RESPONSE_FORMAT.md` → Merged into `AUTHENTICATION_GUIDE.md`
- `TERMS_OF_SERVICE_OAUTH_FLOW.md` → Merged into `AUTHENTICATION_GUIDE.md`
- `OAUTH_FRONTEND_INTEGRATION.md` → Merged into `AUTHENTICATION_GUIDE.md`
- `EMAIL_VERIFICATION_FRONTEND_INTEGRATION.md` → Merged into `EMAIL_VERIFICATION_GUIDE.md`
- `EMAIL_SETUP_GUIDE.md` → Merged into `EMAIL_VERIFICATION_GUIDE.md`
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` → Merged into `DEPLOYMENT_GUIDE.md`
- `STAGING_SETUP.md` → Merged into `DEPLOYMENT_GUIDE.md`
- `STAGING_QUICKSTART.md` → Merged into `DEPLOYMENT_GUIDE.md`
- Various temporary/outdated docs removed

---

## 🚀 Quick Start

### For New Developers:
1. Read [`AUTHENTICATION_GUIDE.md`](AUTHENTICATION_GUIDE.md) - Understand auth system
2. Read [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Set up local environment
3. Check [`MIGRATIONS_GUIDE.md`](MIGRATIONS_GUIDE.md) - Learn database workflow

### For Frontend Developers:
1. [`AUTHENTICATION_GUIDE.md`](AUTHENTICATION_GUIDE.md) - API endpoints and integration
2. [`EMAIL_VERIFICATION_GUIDE.md`](EMAIL_VERIFICATION_GUIDE.md) - Email verification integration
3. [`DEPLOYMENT_URLS.md`](DEPLOYMENT_URLS.md) - API URLs for all environments

### For DevOps/Deployment:
1. [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Complete deployment process
2. [`MIGRATIONS_GUIDE.md`](MIGRATIONS_GUIDE.md) - Database migration workflow
3. [`FIX_STAGING_MIGRATION_BASELINE.md`](FIX_STAGING_MIGRATION_BASELINE.md) - Migration troubleshooting

---

## 💡 Tips

- **All guides have table of contents** - Jump to specific sections easily
- **Code examples included** - Copy-paste ready React/TypeScript examples
- **Troubleshooting sections** - Common issues and solutions documented
- **Cross-references** - Related documentation linked throughout

---

## 📝 Contributing to Documentation

When adding new documentation:
1. Keep it in the appropriate main guide (don't create many small files)
2. Use clear headings and table of contents
3. Include code examples where applicable
4. Add troubleshooting sections
5. Update this README with links

---

## 🔗 External Documentation

- [Hono.js Docs](https://hono.dev/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Bun Docs](https://bun.sh/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vitest Docs](https://vitest.dev/)

---

**Last Updated**: January 7, 2025  
**Maintained By**: FitRecipes Team
