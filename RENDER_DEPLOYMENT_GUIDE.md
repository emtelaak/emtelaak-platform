# Emtelaak Platform - Render Deployment Guide

## Repository

**GitHub Repository**: https://github.com/emtelaak/emtelaak-platform

## Prerequisites

Before deploying to Render, ensure you have:

1. A Render account (https://render.com)
2. A MySQL database (TiDB Cloud, PlanetScale, or other MySQL-compatible service)
3. SendGrid account for email notifications
4. AWS S3 for file storage (configured via Forge API)

## Deployment Steps

### Step 1: Create a New Web Service on Render

1. Log in to your Render dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub account if not already connected
4. Select the repository: `emtelaak/emtelaak-platform`
5. Configure the service:

| Setting | Value |
|---------|-------|
| Name | emtelaak-platform |
| Region | Frankfurt (EU) or your preferred region |
| Branch | main |
| Runtime | Node |
| Build Command | `pnpm install && pnpm build` |
| Start Command | `pnpm start` |
| Plan | Starter ($7/month) or higher |

### Step 2: Configure Environment Variables

Add the following environment variables in Render's dashboard:

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/emtelaak?ssl={"rejectUnauthorized":true}` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | Generate with `openssl rand -base64 32` |
| `FRONTEND_URL` | Your Render app URL | `https://emtelaak-platform.onrender.com` |

#### Email Configuration (SendGrid)

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | `apikey` |
| `SMTP_PASSWORD` | SendGrid API key | `SG.xxxxxxxxxxxx` |
| `SMTP_FROM_EMAIL` | Sender email | `noreply@emtelaak.com` |
| `SMTP_FROM_NAME` | Sender name | `Emtelaak Platform` |

#### Optional Variables

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region |
| `S3_BUCKET_NAME` | S3 bucket name |


### Step 3: Database Setup

1. Create a MySQL database on TiDB Cloud, PlanetScale, or another provider
2. Copy the connection string and add it to `DATABASE_URL`
3. The application will automatically run migrations on first startup

#### TiDB Cloud Setup (Recommended)

1. Go to https://tidbcloud.com
2. Create a new Serverless cluster
3. Get the connection string from the cluster dashboard
4. Format: `mysql://user:password@host:4000/database?ssl={"rejectUnauthorized":true}`

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy your application
3. Wait for the build to complete (usually 3-5 minutes)
4. Your app will be available at `https://your-service-name.onrender.com`

## Post-Deployment

### Create Admin Account

After deployment, create your first Super Admin account:

1. Go to `https://your-app.onrender.com/register`
2. Create an account with your email
3. Access the database and run:

```sql
UPDATE users 
SET role = 'super_admin', email_verified = 1 
WHERE email = 'your-email@example.com';
```

### Health Check

Verify the deployment by visiting:
- `https://your-app.onrender.com/health`

Should return: `{"status":"ok"}`

## Troubleshooting

### Build Fails

- Check that all environment variables are set
- Verify the `DATABASE_URL` format is correct
- Check Render logs for specific error messages

### Database Connection Issues

- Ensure SSL is enabled in the connection string
- Verify the database allows connections from Render's IP ranges
- Check that the database user has proper permissions

### Application Errors

- Check Render logs for error details
- Verify all required environment variables are set
- Ensure the database schema is up to date

## Support

For issues or questions:
- GitHub Issues: https://github.com/emtelaak/emtelaak-platform/issues
- Email: support@emtelaak.com
