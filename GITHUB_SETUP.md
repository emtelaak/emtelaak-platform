# GitHub Repository Setup Guide

This guide explains how to push the Emtelaak platform to a GitHub repository for test environment deployment.

---

## 🎯 Overview

The Emtelaak platform is currently managed in a Manus-hosted environment. This guide will help you:
1. Create a new GitHub repository
2. Push the codebase to GitHub
3. Set up a test environment
4. Configure deployment

---

## 📋 Prerequisites

- GitHub account
- Git installed locally
- GitHub CLI (optional but recommended)
- Access to this codebase

---

## 🚀 Quick Setup

### Method 1: Using GitHub CLI (Recommended)

```bash
# 1. Navigate to project directory
cd /home/ubuntu/emtelaak-platform

# 2. Install GitHub CLI (if not installed)
# Ubuntu/Debian:
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# 3. Authenticate with GitHub
gh auth login

# 4. Create new GitHub repository
gh repo create emtelaak-platform-test \
  --public \
  --description "Emtelaak Property Fractions Investment Platform - Test Environment" \
  --source=. \
  --remote=github \
  --push

# Done! Your code is now on GitHub
```

### Method 2: Manual Setup

```bash
# 1. Create repository on GitHub.com
# Go to: https://github.com/new
# Repository name: emtelaak-platform-test
# Description: Emtelaak Property Fractions Investment Platform - Test Environment
# Visibility: Public or Private
# Do NOT initialize with README (we already have one)

# 2. Add GitHub as a remote
cd /home/ubuntu/emtelaak-platform
git remote add github https://github.com/YOUR_USERNAME/emtelaak-platform-test.git

# 3. Push to GitHub
git add .
git commit -m "Initial commit: Full Emtelaak platform with admin dashboards"
git push github master

# Or if you want to use 'main' as branch name:
git branch -M main
git push -u github main
```

---

## 📂 What Gets Pushed

### Included Files

✅ **Source Code:**
- `client/` - Frontend React application
- `server/` - Backend Node.js application
- `drizzle/` - Database schemas
- `shared/` - Shared types and constants
- `storage/` - S3 utilities

✅ **Configuration:**
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Vite config
- `tailwind.config.ts` - Tailwind config
- `drizzle.config.ts` - Database config
- `.gitignore` - Git ignore rules

✅ **Documentation:**
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `GITHUB_SETUP.md` - This file
- `INVESTMENT_FLOW_IMPLEMENTATION.md` - Investment system docs
- `BREADCRUMB_IMPLEMENTATION.md` - Breadcrumb navigation docs
- `OOM_INVESTIGATION_REPORT.md` - Memory optimization guide
- `todo.md` - Development tasks

### Excluded Files (via .gitignore)

❌ **Build Artifacts:**
- `node_modules/`
- `dist/`
- `.next/`
- `build/`

❌ **Environment Files:**
- `.env`
- `.env.local`
- `.env.*.local`

❌ **IDE Files:**
- `.vscode/`
- `.idea/`
- `*.swp`

❌ **Logs:**
- `*.log`
- `npm-debug.log*`

---

## 🔐 Security Checklist

Before pushing to GitHub, verify:

- [ ] `.env` is in `.gitignore`
- [ ] No API keys in code
- [ ] No passwords in code
- [ ] No sensitive data in comments
- [ ] `.gitignore` is properly configured
- [ ] Database credentials not hardcoded

**⚠️ IMPORTANT**: Never commit:
- Environment variables (`.env`)
- API keys or secrets
- Database passwords
- Private keys
- User data

---

## 🌐 GitHub Repository Settings

### Recommended Settings

**1. Repository Visibility**
- **Public**: For open-source or public test environment
- **Private**: For internal testing (recommended)

**2. Branch Protection**
```
Settings → Branches → Add rule

Branch name pattern: main
☑ Require pull request reviews before merging
☑ Require status checks to pass before merging
☑ Require branches to be up to date before merging
```

**3. Secrets Configuration**
```
Settings → Secrets and variables → Actions → New repository secret

Add these secrets for CI/CD:
- DATABASE_URL
- JWT_SECRET
- S3_ACCESS_KEY
- S3_SECRET_KEY
- SMTP_USER
- SMTP_PASS
```

**4. Collaborators**
```
Settings → Collaborators → Add people

Add team members with appropriate permissions:
- Admin: Full access
- Write: Push access
- Read: View only
```

---

## 🚢 Deployment Options

### Option 1: Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from GitHub
vercel --prod

# Or connect GitHub repo in Vercel dashboard:
# 1. Go to vercel.com
# 2. Import Git Repository
# 3. Select your GitHub repo
# 4. Configure environment variables
# 5. Deploy
```

### Option 2: Railway

```bash
# 1. Go to railway.app
# 2. New Project → Deploy from GitHub repo
# 3. Select emtelaak-platform-test
# 4. Add environment variables
# 5. Deploy automatically on push
```

### Option 3: Render

```bash
# 1. Go to render.com
# 2. New → Web Service
# 3. Connect GitHub repository
# 4. Build Command: pnpm install && pnpm build
# 5. Start Command: pnpm start
# 6. Add environment variables
# 7. Create Web Service
```

### Option 4: Docker + Any Cloud

```bash
# Build Docker image
docker build -t emtelaak-platform .

# Push to Docker Hub
docker tag emtelaak-platform yourusername/emtelaak-platform:latest
docker push yourusername/emtelaak-platform:latest

# Deploy to:
# - AWS ECS
# - Google Cloud Run
# - Azure Container Instances
# - DigitalOcean App Platform
```

---

## 🧪 Test Environment Setup

### 1. Create Test Database

```sql
CREATE DATABASE emtelaak_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Test Environment Variables

In your deployment platform, set:

```env
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:3306/emtelaak_test
JWT_SECRET=test-environment-secret-key
# ... other required variables
```

### 3. Run Migrations

```bash
# After deployment, run:
pnpm db:push
```

### 4. Create Test Admin User

1. Login with OAuth
2. First user becomes super admin (if OWNER_OPEN_ID matches)
3. Or manually set in database:
   ```sql
   UPDATE users SET role='admin' WHERE openId='your-open-id';
   ```

---

## 📊 CI/CD Setup (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm type-check
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🔄 Keeping Repository Updated

### Sync Changes from Manus Environment

```bash
# 1. Make changes in Manus environment
# 2. Commit changes
git add .
git commit -m "Description of changes"

# 3. Push to GitHub
git push github master  # or 'main'
```

### Pull Changes from GitHub

```bash
# If working locally
git pull github master  # or 'main'
```

---

## 📝 Repository Structure

```
emtelaak-platform-test/
├── .github/
│   └── workflows/          # CI/CD workflows
├── client/                 # Frontend application
├── server/                 # Backend application
├── drizzle/                # Database schemas
├── shared/                 # Shared code
├── storage/                # Storage utilities
├── docs/                   # Additional documentation
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
├── README.md               # Project overview
├── DEPLOYMENT.md           # Deployment guide
├── GITHUB_SETUP.md         # This file
└── ... (other config files)
```

---

## 🆘 Troubleshooting

### Issue: Push Rejected

```bash
# If push is rejected due to divergent histories
git pull github master --rebase
git push github master
```

### Issue: Large Files

```bash
# If you have files > 100MB
# Use Git LFS (Large File Storage)
git lfs install
git lfs track "*.zip"
git lfs track "*.sql"
git add .gitattributes
git commit -m "Configure Git LFS"
```

### Issue: Authentication Failed

```bash
# Use personal access token instead of password
# Generate token at: https://github.com/settings/tokens
# Use token as password when prompted
```

---

## ✅ Post-Deployment Checklist

After pushing to GitHub and deploying:

- [ ] Repository is accessible
- [ ] README displays correctly
- [ ] Documentation is complete
- [ ] Deployment successful
- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] Admin access working
- [ ] Test all major features
- [ ] Monitor error logs
- [ ] Set up alerts/monitoring

---

## 📞 Support

### Resources

- **GitHub Docs**: https://docs.github.com
- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs

### Getting Help

1. Check documentation in `/docs` folder
2. Review GitHub Issues
3. Contact development team
4. Open support ticket

---

## 🎉 Success!

Once completed, your Emtelaak platform will be:
- ✅ Hosted on GitHub
- ✅ Accessible to team members
- ✅ Ready for deployment
- ✅ Version controlled
- ✅ Documented
- ✅ Test environment ready

**Next Steps:**
1. Share repository URL with team
2. Set up deployment pipeline
3. Configure test environment
4. Start testing!

---

**Created**: November 2024  
**Version**: 1.0.0
