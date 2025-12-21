# Emtelaak Platform - Deployment Guide

This guide provides step-by-step instructions for deploying the Emtelaak platform in various environments.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Local Development](#local-development)
5. [Production Deployment](#production-deployment)
6. [Test Environment](#test-environment)
7. [Admin Access](#admin-access)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

- **Node.js** 22.x or higher
- **pnpm** 9.x or higher
- **MySQL** 8.x or **TiDB** (recommended for scalability)
- **Git** for version control

### Optional Services

- **S3-compatible storage** (AWS S3, MinIO, etc.) for file uploads
- **SMTP server** for email notifications
- **Redis** (optional, for caching)

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB storage

**Recommended:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ storage

---

## 🌍 Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd emtelaak-platform
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/emtelaak"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# Application
NODE_ENV="development"
VITE_APP_ID="emtelaak-platform"
VITE_APP_TITLE="Emtelaak - Property Fractions"
VITE_APP_LOGO="/logo.png"

# Owner (Super Admin)
OWNER_OPEN_ID="your-oauth-open-id"
OWNER_NAME="Admin Name"

# Storage (S3)
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="emtelaak-uploads"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@emtelaak.com"

# API Keys (Optional)
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="your-api-key"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-api-key"

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT="https://analytics.example.com"
VITE_ANALYTICS_WEBSITE_ID="your-website-id"
```

---

## 🗄️ Database Setup

### Option 1: MySQL

```bash
# Create database
mysql -u root -p
CREATE DATABASE emtelaak CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'emtelaak_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON emtelaak.* TO 'emtelaak_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Option 2: TiDB (Recommended)

1. Sign up at [TiDB Cloud](https://tidbcloud.com/)
2. Create a new cluster
3. Get connection string
4. Update `DATABASE_URL` in `.env`

### Run Migrations

```bash
# Push schema to database
pnpm db:push

# Verify tables created
pnpm db:studio
```

This creates all 30+ tables including:
- Users and authentication
- Properties and offerings
- Investments and payments
- Admin settings and configurations

---

## 💻 Local Development

### Start Development Server

```bash
pnpm dev
```

This starts:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api/trpc
- **Hot reload**: Enabled for both frontend and backend

### Development Features

- ✅ Hot module replacement (HMR)
- ✅ TypeScript type checking
- ✅ Automatic server restart
- ✅ Source maps for debugging
- ✅ 3GB memory allocation (configured in package.json)

### Access the Application

1. Open http://localhost:3000
2. Click "Login" to authenticate
3. Use OAuth credentials to sign in
4. First user with `OWNER_OPEN_ID` becomes super admin

---

## 🚀 Production Deployment

### 1. Build for Production

```bash
# Set production environment
export NODE_ENV=production

# Build application
pnpm build

# Test production build locally
pnpm preview
```

### 2. Deployment Options

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=3072"
  }
}
```

#### Option B: Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

#### Option C: Docker

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t emtelaak-platform .
docker run -p 3000:3000 --env-file .env emtelaak-platform
```

#### Option D: VPS (Ubuntu/Debian)

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Clone and setup
git clone <repository-url>
cd emtelaak-platform
pnpm install
pnpm build

# Use PM2 for process management
npm install -g pm2
pm2 start "pnpm start" --name emtelaak
pm2 save
pm2 startup
```

### 3. Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up S3 storage
- [ ] Configure SMTP for emails
- [ ] Enable HTTPS/SSL
- [ ] Set up domain and DNS
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Test all admin features

---

## 🧪 Test Environment

### Quick Test Setup

```bash
# Use SQLite for quick testing (no MySQL needed)
DATABASE_URL="file:./test.db"

# Minimal configuration
JWT_SECRET="test-secret-key"
NODE_ENV="development"

# Start server
pnpm dev
```

### Test Accounts

After first login, the user with `OWNER_OPEN_ID` becomes super admin.

**Roles to Test:**
1. **Super Admin** - Full platform access
2. **Admin** - Admin dashboard access
3. **Fundraiser** - Create offerings
4. **Investor** - Browse and invest
5. **Agent** - CRM features

### Test Data

Create test data via admin dashboard:
1. Login as super admin
2. Go to `/admin/user-management`
3. Create test users with different roles
4. Go to `/admin/property-management`
5. Create test properties
6. Create test offerings

---

## 👨‍💼 Admin Access

### Super Admin Dashboard

**URL**: `/super-admin`

**Features:**
- Platform-wide statistics
- User management
- Role and permission management
- Security settings
- IP blocking
- Platform configuration

**Access**: Only users with `role='admin'` AND `openId=OWNER_OPEN_ID`

### Admin Dashboard

**URL**: `/admin`

**Features:**
- User management (`/admin/user-management`)
- Property management (`/admin/property-management`)
- Offering approvals (`/admin/offering-approvals`)
- KYC review (`/admin/kyc-review`)
- Wallet management (`/admin/wallet`)
- Email templates (`/admin/email-templates`)
- Legal documents (`/admin/legal-documents`)
- Platform settings (`/admin/platform-settings`)
- And more...

**Access**: Users with `role='admin'`

### Granting Admin Access

**Method 1: Database**
```sql
UPDATE users SET role='admin' WHERE openId='user-open-id';
```

**Method 2: Super Admin Dashboard**
1. Login as super admin
2. Go to `/admin/user-management`
3. Find user
4. Change role to "admin"
5. Save changes

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
- Verify `DATABASE_URL` is correct
- Check database server is running
- Verify network connectivity
- Check firewall rules

#### 2. Build Memory Error (OOM)

**Error**: `JavaScript heap out of memory`

**Solution**:
```bash
# Increase Node.js memory (already configured in package.json)
export NODE_OPTIONS="--max-old-space-size=3072"
pnpm build
```

#### 3. TypeScript Errors

**Error**: Type errors during build

**Solution**:
```bash
# Check for errors
pnpm type-check

# Fix errors or temporarily skip
pnpm build --no-typecheck
```

#### 4. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

#### 5. Authentication Issues

**Error**: Cannot login or JWT errors

**Solution**:
- Verify `JWT_SECRET` is set
- Check `OAUTH_SERVER_URL` is correct
- Clear browser cookies
- Check server logs for details

#### 6. Missing Environment Variables

**Error**: `Environment variable X is not defined`

**Solution**:
- Copy `.env.example` to `.env`
- Fill in all required variables
- Restart server after changes

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment
DEBUG=* pnpm dev

# Or specific modules
DEBUG=trpc:*,express:* pnpm dev
```

### Health Checks

```bash
# Check server status
curl http://localhost:3000/api/trpc/auth.me

# Check database connection
pnpm db:studio

# Check build
pnpm build && pnpm preview
```

---

## 📊 Performance Optimization

### Production Optimizations

1. **Enable Compression**
   - Gzip/Brotli compression for static assets
   - Already configured in Vite

2. **CDN for Static Assets**
   - Upload `dist/assets/*` to CDN
   - Update asset URLs

3. **Database Optimization**
   - Add indexes for frequently queried fields
   - Use connection pooling
   - Enable query caching

4. **Caching**
   - Redis for session storage
   - Cache API responses
   - Use HTTP caching headers

5. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor performance (New Relic)
   - Track analytics

---

## 🔒 Security Best Practices

### Production Security

1. **Environment Variables**
   - Never commit `.env` to git
   - Use secrets management (AWS Secrets Manager, etc.)
   - Rotate secrets regularly

2. **Database**
   - Use strong passwords
   - Enable SSL/TLS connections
   - Regular backups
   - Limit database user permissions

3. **API Security**
   - Enable rate limiting (already configured)
   - Use HTTPS only
   - Implement CORS properly
   - Validate all inputs

4. **Authentication**
   - Use strong JWT secrets
   - Implement token refresh
   - Enable 2FA (if available)
   - Monitor failed login attempts

5. **Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular security audits

---

## 📞 Support

### Getting Help

- **Documentation**: Check `/docs` folder
- **Logs**: Check server logs for errors
- **Database**: Use `pnpm db:studio` to inspect data
- **Community**: Open GitHub issue

### Reporting Issues

Include:
1. Environment (dev/prod)
2. Node.js version
3. Error messages
4. Steps to reproduce
5. Expected vs actual behavior

---

## 📝 Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check server health
- Review security alerts

**Weekly:**
- Database backups
- Update dependencies
- Review user feedback

**Monthly:**
- Security audit
- Performance review
- Cleanup old data

---

**Last Updated**: November 2024  
**Version**: 1.0.0
