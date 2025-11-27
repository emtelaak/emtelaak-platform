# Emtelaak Platform - Quick Start Guide

Deploy the entire Emtelaak platform to AWS with a single command in under 20 minutes.

## Prerequisites (5 minutes)

### 1. AWS Account
- Create an AWS account at https://aws.amazon.com
- Enable billing (required for resource creation)
- Note your AWS Account ID

### 2. Install AWS CLI

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download and install from: https://awscli.amazonaws.com/AWSCLIV2.msi

### 3. Install Terraform

**macOS:**
```bash
brew tap hashicorp/tap
brew install hashicorp/terraform
```

**Linux:**
```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

**Windows:**
Download from: https://www.terraform.io/downloads

### 4. Configure AWS Credentials

```bash
aws configure
```

Enter:
- **AWS Access Key ID**: Your access key
- **AWS Secret Access Key**: Your secret key
- **Default region**: `us-east-1` (recommended)
- **Default output format**: `json`

**Don't have AWS credentials?**
1. Go to AWS Console → IAM → Users → Your User
2. Click "Security credentials"
3. Click "Create access key"
4. Download and save the credentials

---

## One-Command Deployment (15 minutes)

### Step 1: Clone Repository

```bash
git clone https://github.com/emtelaak/emtelaak-platform.git
cd emtelaak-platform
```

### Step 2: Run Deployment Script

```bash
./deploy-to-aws.sh dev us-east-1
```

**That's it!** The script will:
1. ✅ Check prerequisites
2. ✅ Create SSH key pair
3. ✅ Initialize Terraform
4. ✅ Plan infrastructure
5. ✅ Deploy all AWS resources (VPC, RDS, S3, EC2)
6. ✅ Install and configure application
7. ✅ Run database migrations
8. ✅ Start the application service

**Deployment time:** 10-15 minutes (mostly waiting for RDS database creation)

### Step 3: Access Your Application

After deployment completes, you'll see:

```
╔════════════════════════════════════════════════════════════╗
║              🎉 DEPLOYMENT SUCCESSFUL! 🎉                  ║
╚════════════════════════════════════════════════════════════╝

Access your application:
  URL: http://54.123.45.67:3000
  SSH: ssh -i emtelaak-dev-key.pem ubuntu@54.123.45.67
```

Open the URL in your browser to access the platform!

---

## Post-Deployment Configuration (5 minutes)

### 1. Configure Email (SendGrid)

1. Sign up for SendGrid: https://signup.sendgrid.com/
2. Create an API key
3. Update `.env.dev` file:
   ```bash
   SMTP_PASSWORD=your-sendgrid-api-key
   ```
4. Restart application:
   ```bash
   ssh -i emtelaak-dev-key.pem ubuntu@<EC2_IP>
   sudo systemctl restart emtelaak
   ```

### 2. Configure Payments (Stripe)

1. Sign up for Stripe: https://dashboard.stripe.com/register
2. Get your API keys (test mode)
3. Update `.env.dev` file:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your-key
   STRIPE_PUBLISHABLE_KEY=pk_test_your-key
   ```
4. Restart application

### 3. Set Up Domain (Optional)

1. Point your domain's A record to the EC2 IP
2. Wait for DNS propagation (5-30 minutes)
3. Set up SSL certificate (see docs/AWS_DEPLOYMENT.md)

---

## Verify Deployment

Run the verification script:

```bash
./verify-deployment.sh
```

This checks:
- ✅ EC2 instance connectivity
- ✅ Application port accessibility
- ✅ HTTP response
- ✅ Database connectivity
- ✅ S3 bucket access
- ✅ Application service status

---

## What Was Created?

### AWS Resources

| Resource | Type | Purpose | Monthly Cost |
|----------|------|---------|--------------|
| VPC | Network | Private network | Free |
| Subnets | Network | Public/Private subnets | Free |
| Internet Gateway | Network | Internet access | Free |
| NAT Gateway | Network | Private subnet internet | ~$32 |
| RDS MySQL | Database | db.t3.medium, 100GB | ~$60 |
| S3 Bucket | Storage | File storage | ~$2 |
| EC2 Instance | Compute | t3.medium | ~$30 |
| IAM User | Security | S3 access | Free |
| Security Groups | Security | Firewall rules | Free |

**Total: ~$150/month for development**

### Application Components

- ✅ React 19 frontend (built and served)
- ✅ Express + tRPC backend
- ✅ MySQL database with schema
- ✅ S3 file storage
- ✅ Email service (SendGrid)
- ✅ Payment processing (Stripe)
- ✅ User authentication
- ✅ Admin dashboard
- ✅ All 58 pages and features

---

## Common Issues

### Issue: "AWS credentials not configured"

**Solution:**
```bash
aws configure
```
Enter your AWS access key and secret key.

### Issue: "Key pair already exists"

**Solution:**
The script will use the existing key pair. If you don't have the `.pem` file, delete the key pair in AWS Console and run the script again.

### Issue: "Terraform not found"

**Solution:**
Install Terraform following the prerequisites section above.

### Issue: "Application not responding"

**Solution:**
1. Wait 5 more minutes (initial setup takes time)
2. Check logs:
   ```bash
   ssh -i emtelaak-dev-key.pem ubuntu@<EC2_IP>
   sudo journalctl -u emtelaak -n 50
   ```

### Issue: "Database connection failed"

**Solution:**
1. Check security group allows connection from EC2
2. Verify DATABASE_URL in `.env` file
3. Check RDS is in "available" state in AWS Console

---

## Cleanup / Destroy Resources

To remove all AWS resources and stop incurring costs:

```bash
cd terraform
terraform destroy
```

Type `yes` to confirm.

**Warning:** This will delete:
- All data in the database
- All files in S3
- The EC2 instance
- All networking resources

Make sure to backup any important data first!

---

## Next Steps

1. **Customize branding**: Update logo and colors in admin settings
2. **Add properties**: Create your first property offerings
3. **Invite users**: Set up email templates and invite investors
4. **Configure payments**: Test the investment flow with Stripe test mode
5. **Set up monitoring**: Configure CloudWatch alarms (see docs/AWS_DEPLOYMENT.md)
6. **Production deployment**: Run `./deploy-to-aws.sh prod us-east-1` for production

---

## Support

- **Documentation**: See `docs/AWS_DEPLOYMENT.md` for detailed guides
- **GitHub Issues**: https://github.com/emtelaak/emtelaak-platform/issues
- **Email**: support@emtelaak.com

---

## Cost Optimization

### Development Environment
- Use Spot Instances for EC2 (save 70%)
- Use Aurora Serverless for database (pay per use)
- Enable S3 Intelligent-Tiering
- Stop EC2 when not in use

### Production Environment
- Use Reserved Instances (save 40-60%)
- Enable RDS Multi-AZ only if needed
- Use CloudFront CDN for static assets
- Set up auto-scaling for EC2

---

**Congratulations! Your Emtelaak platform is now running on AWS! 🎉**
