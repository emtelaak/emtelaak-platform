# AWS Development Environment Setup Guide

## Overview
This guide provides step-by-step instructions for setting up a complete development environment for the Emtelaak platform on AWS infrastructure.

## Current State Analysis

### TypeScript Errors Summary (95 total)
1. **offerings.ts** - Type mismatch in milestone updates (string vs enum)
2. **incomeDistribution.ts** - Unknown property 'entityType' in audit logs
3. **localAuth.ts** - Missing 'maxAge' property in cookie options
4. **monitoring.ts** - ResultSetHeader type conversion issues (7 occurrences)
5. **propertyManagement.ts** - Multiple entityType errors in audit logs

### Database Issues
- Session creation errors (being fixed)
- Enum validation mismatches
- Audit log schema inconsistencies

### Storage Issues
- Currently using Manus built-in S3
- Need to migrate to dedicated AWS S3 bucket

---

## AWS Infrastructure Requirements

### 1. Database - Amazon RDS
**Recommended Configuration:**
- Engine: MySQL 8.0 or PostgreSQL 14+
- Instance Type: db.t3.medium (development) / db.r5.large (production)
- Storage: 100GB GP3 SSD (auto-scaling enabled)
- Multi-AZ: Yes (production), No (development)
- Backup: Automated daily backups, 7-day retention

**Connection Details Needed:**
```
DATABASE_URL=mysql://username:password@rds-endpoint:3306/emtelaak_dev
```

### 2. Storage - Amazon S3
**Bucket Configuration:**
- Bucket Name: `emtelaak-dev-storage`
- Region: us-east-1 (or your preferred region)
- Versioning: Enabled
- Encryption: AES-256 (SSE-S3)
- Public Access: Blocked (use presigned URLs)
- Lifecycle Policy: Archive to Glacier after 90 days

**IAM Policy Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::emtelaak-dev-storage/*",
        "arn:aws:s3:::emtelaak-dev-storage"
      ]
    }
  ]
}
```

### 3. Compute - AWS EC2 or ECS
**Option A: EC2 (Simpler)**
- Instance Type: t3.medium
- OS: Ubuntu 22.04 LTS
- Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (dev server)

**Option B: ECS Fargate (Scalable)**
- Task Definition: 2 vCPU, 4GB RAM
- Service: Auto-scaling 2-10 tasks
- Load Balancer: Application Load Balancer

### 4. Networking
- VPC: Create dedicated VPC with public and private subnets
- Security Groups:
  - Web tier: Allow 80, 443 from 0.0.0.0/0
  - App tier: Allow 3000 from Web tier
  - Database tier: Allow 3306 from App tier only

---

## Migration Steps

### Step 1: Fix All TypeScript Errors

#### Fix 1: offerings.ts milestone type error
```typescript
// Current (line 521):
await updateOfferingMilestone(milestoneId, {
  milestoneType: input.milestoneType, // string
  // ...
});

// Fixed:
await updateOfferingMilestone(milestoneId, {
  milestoneType: input.milestoneType as any, // Type assertion
  // OR properly type the input schema
});
```

#### Fix 2: Remove entityType from audit logs
```typescript
// In incomeDistribution.ts, propertyManagement.ts
// Remove all instances of:
entityType: "property" // This field doesn't exist in schema

// Use targetType instead:
targetType: "property"
```

#### Fix 3: localAuth.ts cookie maxAge
```typescript
// Current:
const cookieOptions = getSessionCookieOptions(ctx.req);
if (input.rememberMe) {
  cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // Error!
}

// Fixed:
const cookieOptions = {
  ...getSessionCookieOptions(ctx.req),
  ...(input.rememberMe && { maxAge: 30 * 24 * 60 * 60 * 1000 })
};
```

#### Fix 4: monitoring.ts ResultSetHeader
```typescript
// Current:
const result = await db.execute(sql) as any[];

// Fixed:
const result = await db.execute(sql);
const rows = Array.isArray(result) ? result : [];
```

### Step 2: Database Migration to AWS RDS

#### 2.1 Export Current Schema
```bash
# Run this in your current environment
cd /home/ubuntu/emtelaak-platform
npx drizzle-kit generate:mysql
```

#### 2.2 Create RDS Instance
1. Go to AWS RDS Console
2. Create Database
3. Choose MySQL 8.0
4. Set master username/password
5. Configure VPC and security groups
6. Enable automated backups

#### 2.3 Run Migrations on RDS
```bash
# Update .env with RDS connection string
DATABASE_URL=mysql://admin:password@emtelaak-dev.xxxxx.us-east-1.rds.amazonaws.com:3306/emtelaak

# Run migrations
pnpm db:push
```

### Step 3: Configure AWS S3 Storage

#### 3.1 Create S3 Bucket
```bash
aws s3 mb s3://emtelaak-dev-storage --region us-east-1
```

#### 3.2 Update server/storage.ts
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
) {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: data,
    ContentType: contentType,
  });

  await s3Client.send(command);

  return {
    key,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`,
  };
}
```

#### 3.3 Environment Variables
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=emtelaak-dev-storage
```

### Step 4: Containerization

#### 4.1 Create Dockerfile
```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build client
RUN pnpm build:client

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
```

#### 4.2 Create docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_BUCKET=${AWS_S3_BUCKET}
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=emtelaak_dev
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

### Step 5: CI/CD with GitHub Actions

#### 5.1 Create .github/workflows/deploy.yml
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: emtelaak-platform
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster emtelaak-dev --service emtelaak-app --force-new-deployment
```

---

## Environment Variables Checklist

```env
# Database
DATABASE_URL=mysql://user:pass@host:3306/db

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=emtelaak-dev-storage

# Application
NODE_ENV=development
JWT_SECRET=
VITE_APP_ID=
VITE_APP_TITLE=Emtelaak
VITE_APP_LOGO=

# OAuth (if using Manus OAuth)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
OWNER_OPEN_ID=
OWNER_NAME=
```

---

## Testing Checklist

- [ ] Database connection successful
- [ ] All migrations applied
- [ ] S3 file upload works
- [ ] S3 file download works
- [ ] Authentication flow works
- [ ] All 210+ tests pass
- [ ] Session management works
- [ ] Payment processing works
- [ ] Email notifications work

---

## Estimated Costs (Monthly)

- **RDS db.t3.medium**: ~$60
- **S3 Storage (100GB)**: ~$2.30
- **EC2 t3.medium**: ~$30
- **Data Transfer**: ~$10
- **Total**: ~$102/month (development)

Production costs will be higher with larger instances and multi-AZ setup.

---

## Next Steps

1. Review and approve this migration plan
2. Create AWS account and set up billing alerts
3. Fix all TypeScript errors
4. Set up RDS database
5. Configure S3 bucket
6. Update code for AWS SDK
7. Test locally with Docker
8. Deploy to AWS EC2/ECS
9. Run full test suite
10. Monitor and optimize

---

## Support Resources

- AWS Documentation: https://docs.aws.amazon.com/
- Drizzle ORM: https://orm.drizzle.team/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/
