# Emtelaak Platform - Production Deployment Guide

**Version:** 1.0  
**Last Updated:** December 21, 2024  
**Author:** Manus AI

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Repository Setup](#repository-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Local Development](#local-development)
7. [Production Deployment Options](#production-deployment-options)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Security Considerations](#security-considerations)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Emtelaak is a fractional real estate investment platform built with:

| Component | Technology |
|-----------|------------|
| Frontend | React 19 + TypeScript + Tailwind CSS 4 |
| Backend | Express.js + tRPC 11 |
| Database | MySQL 8.0 / TiDB |
| ORM | Drizzle ORM |
| Authentication | JWT + Email/Password + 2FA (TOTP) |
| File Storage | AWS S3 |
| Email | SendGrid |

### Key Features
- Email/password authentication with 2FA support
- Property listings and investment management
- User wallet with deposit/withdrawal functionality
- KYC verification system
- Admin dashboard with role-based permissions
- Bilingual support (English/Arabic)

---

## Prerequisites

Before deploying, ensure you have:

### Required Software
```bash
# Node.js 18+ (LTS recommended)
node --version  # Should be 18.x or higher

# pnpm package manager
npm install -g pnpm

# Git
git --version
```

### Required Accounts & Services
- **GitHub Account** - For repository hosting
- **MySQL Database** - Self-hosted or managed (PlanetScale, TiDB Cloud, AWS RDS)
- **AWS Account** - For S3 file storage
- **SendGrid Account** - For transactional emails
- **Hosting Provider** - Render, Railway, Vercel, AWS, or VPS

---

## Repository Setup

### Step 1: Initialize Git Repository

```bash
# Navigate to your project directory
cd emtelaak-platform

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Emtelaak Platform v1.0"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `emtelaak-platform` (or your preferred name)
3. Keep it private for security
4. Do NOT initialize with README (we already have one)

### Step 3: Push to GitHub

```bash
# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/emtelaak-platform.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 4: Set Up Branch Protection (Recommended)

In GitHub repository settings:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable "Require pull request reviews before merging"
4. Enable "Require status checks to pass before merging"

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=mysql://username:password@host:3306/emtelaak

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# ===========================================
# AWS S3 STORAGE
# ===========================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=emtelaak-uploads
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net

# ===========================================
# EMAIL (SENDGRID)
# ===========================================
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# ===========================================
# PUSH NOTIFICATIONS (OPTIONAL)
# ===========================================
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (min 32 chars) |
| `AWS_ACCESS_KEY_ID` | Yes | AWS IAM access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS IAM secret key |
| `AWS_REGION` | Yes | AWS region (e.g., us-east-1) |
| `S3_BUCKET_NAME` | Yes | S3 bucket for file uploads |
| `SENDGRID_API_KEY` | Yes | SendGrid API key for emails |
| `SENDGRID_FROM_EMAIL` | Yes | Verified sender email |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Server port (default: 3000) |

---

## Database Setup

### Option 1: Self-Hosted MySQL

```bash
# Install MySQL 8.0
sudo apt update
sudo apt install mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database and user
mysql -u root -p
```

```sql
CREATE DATABASE emtelaak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'emtelaak_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON emtelaak.* TO 'emtelaak_user'@'%';
FLUSH PRIVILEGES;
```

### Option 2: TiDB Cloud (Recommended for Production)

1. Sign up at [TiDB Cloud](https://tidbcloud.com)
2. Create a Serverless cluster
3. Get connection string from dashboard
4. Update `DATABASE_URL` in your environment

### Option 3: PlanetScale

1. Sign up at [PlanetScale](https://planetscale.com)
2. Create a new database
3. Get connection string with SSL mode
4. Update `DATABASE_URL`

### Run Database Migrations

```bash
# Install dependencies
pnpm install

# Push schema to database
pnpm db:push
```

### Seed Initial Data (Optional)

```bash
# Run seed scripts
mysql -u username -p emtelaak < seed_properties.sql
mysql -u username -p emtelaak < seed_knowledge_base.sql
```

---

## Local Development

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your local settings
nano .env
```

### Step 3: Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Step 4: Create Admin User

After registration, promote a user to admin:

```sql
UPDATE users SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

---

## Production Deployment Options

### Option 1: Render (Recommended for Simplicity)

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   ```yaml
   # render.yaml is already included
   name: emtelaak-platform
   env: node
   buildCommand: pnpm install && pnpm build
   startCommand: pnpm start
   ```

3. **Add Environment Variables**
   - Go to Environment tab
   - Add all required variables from the list above

4. **Deploy**
   - Render will automatically deploy on push to main

### Option 2: Railway

1. **Create Project**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"

2. **Configure**
   ```bash
   # Railway auto-detects Node.js
   # Add environment variables in dashboard
   ```

3. **Add MySQL Database**
   - Click "New" → "Database" → "MySQL"
   - Copy connection string to `DATABASE_URL`

### Option 3: AWS EC2 + RDS

#### EC2 Setup

```bash
# Launch Ubuntu 22.04 instance (t3.small minimum)
# SSH into instance

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Clone repository
git clone https://github.com/YOUR_USERNAME/emtelaak-platform.git
cd emtelaak-platform

# Install dependencies
pnpm install

# Build application
pnpm build

# Start with PM2
pm2 start npm --name "emtelaak" -- start
pm2 save
pm2 startup
```

#### RDS Setup

1. Create MySQL 8.0 instance in AWS RDS
2. Configure security group to allow EC2 access
3. Update `DATABASE_URL` with RDS endpoint

#### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/emtelaak
server {
    listen 80;
    server_name yourdomain.com;

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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/emtelaak /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Option 4: Docker Deployment

```dockerfile
# Dockerfile is included in the project
docker build -t emtelaak-platform .
docker run -p 3000:3000 --env-file .env emtelaak-platform
```

```yaml
# docker-compose.yml is included
docker-compose up -d
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
            -H "Authorization: Bearer $RENDER_API_KEY"
```

---

## Security Considerations

### Authentication Security

The platform uses email/password authentication with:
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Signed with HS256, stored in HTTP-only cookies
- **2FA Support**: TOTP-based with backup codes
- **Session Management**: Database-tracked sessions with device info

### Security Headers

The application includes security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

### Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong JWT secrets** - Minimum 32 characters, randomly generated
3. **Enable SSL/TLS** - Use HTTPS in production
4. **Regular updates** - Keep dependencies updated
5. **Database backups** - Schedule regular backups
6. **Rate limiting** - Already implemented for API endpoints

---

## Monitoring & Maintenance

### Health Checks

The application exposes health endpoints:

```bash
# Basic health check
curl https://yourdomain.com/health

# Readiness check (includes database)
curl https://yourdomain.com/ready
```

### Logging

Logs are output to stdout. For production:

```bash
# With PM2
pm2 logs emtelaak

# View specific log file
pm2 logs emtelaak --lines 100
```

### Database Maintenance

```bash
# Backup database
mysqldump -u user -p emtelaak > backup_$(date +%Y%m%d).sql

# Optimize tables
mysqlcheck -u user -p --optimize emtelaak
```

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Run migrations if needed
pnpm db:push

# Restart application
pm2 restart emtelaak
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: ECONNREFUSED
```
**Solution**: Check `DATABASE_URL` format and database server accessibility.

#### JWT Token Invalid
```
Error: jwt malformed
```
**Solution**: Ensure `JWT_SECRET` is consistent across deployments.

#### S3 Upload Failed
```
Error: Access Denied
```
**Solution**: Verify AWS credentials and S3 bucket permissions.

#### Email Not Sending
```
Error: Unauthorized
```
**Solution**: Verify SendGrid API key and sender email verification.

### Debug Mode

For debugging, set:
```env
NODE_ENV=development
DEBUG=*
```

### Support

For issues:
1. Check logs: `pm2 logs emtelaak`
2. Review database: Check for migration issues
3. Verify environment: Ensure all variables are set

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] Install dependencies (`pnpm install`)
- [ ] Configure environment variables
- [ ] Set up database
- [ ] Run migrations (`pnpm db:push`)
- [ ] Test locally (`pnpm dev`)
- [ ] Deploy to production
- [ ] Configure SSL/TLS
- [ ] Set up monitoring
- [ ] Create admin user

---

## File Structure

```
emtelaak-platform/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── contexts/      # React contexts
│       └── lib/           # Utilities
├── server/                 # Express backend
│   ├── _core/             # Core framework
│   ├── routes/            # API routes
│   └── routers.ts         # tRPC routers
├── drizzle/               # Database schema
├── shared/                # Shared types/constants
├── storage/               # S3 helpers
└── package.json
```

---

**Congratulations!** Your Emtelaak platform is now ready for production deployment.
