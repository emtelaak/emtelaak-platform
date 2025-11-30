# Emtelaak Platform - Production Deployment Guide

**Complete step-by-step guide for deploying to AWS production**

---

## 🎯 Overview

This guide walks you through deploying the Emtelaak platform to AWS with:
- **ECS Fargate** (serverless containers)
- **RDS MySQL** (managed database)
- **Application Load Balancer** (with auto-scaling)
- **SSL/TLS** (HTTPS with ACM certificate)
- **CloudWatch** (monitoring and alarms)

**Estimated Time:** 30-45 minutes  
**Estimated Cost:** ~$60/month

---

## 📋 Prerequisites

### Required Tools
```bash
# Check if installed
aws --version        # AWS CLI 2.0+
terraform --version  # Terraform 1.0+
docker --version     # Docker 20.10+
git --version        # Git
```

### AWS Account Setup
1. Create AWS account (if you don't have one)
2. Configure AWS CLI:
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

3. Verify credentials:
```bash
aws sts get-caller-identity
```

### Domain Name (Optional but Recommended)
- Purchase a domain (e.g., from Route 53, Namecheap, GoDaddy)
- Have access to DNS management

---

## 🚀 Step 1: Deploy AWS Infrastructure

### Option A: Automated Deployment (Recommended)

```bash
# Run the automated deployment script
./scripts/deploy-to-aws.sh
```

This script will:
1. ✅ Check prerequisites
2. ✅ Initialize Terraform
3. ✅ Create infrastructure (VPC, RDS, S3, ECS, ALB)
4. ✅ Build and push Docker image
5. ✅ Deploy to ECS Fargate
6. ✅ Verify deployment

### Option B: Manual Deployment

```bash
# 1. Navigate to terraform directory
cd terraform

# 2. Initialize Terraform
terraform init

# 3. Create terraform.tfvars
cat > terraform.tfvars <<EOF
aws_region           = "us-east-1"
project_name         = "emtelaak"
environment          = "prod"
vpc_cidr             = "10.0.0.0/16"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_name              = "emtelaak_prod"
db_username          = "emtelaak_admin"
db_multi_az          = false
EOF

# 4. Review plan
terraform plan

# 5. Apply infrastructure
terraform apply

# 6. Get outputs
terraform output
```

### Infrastructure Created

| Resource | Type | Purpose |
|----------|------|---------|
| VPC | Network | Isolated network environment |
| Public Subnets | Network | For load balancer |
| Private Subnets | Network | For ECS tasks and RDS |
| RDS MySQL | Database | Application database |
| S3 Bucket | Storage | File uploads |
| ECR Repository | Container Registry | Docker images |
| ECS Cluster | Compute | Container orchestration |
| Application Load Balancer | Load Balancing | Traffic distribution |
| Auto Scaling | Scaling | 1-4 containers |
| CloudWatch Logs | Logging | Application logs |

---

## 🐳 Step 2: Build and Deploy Application

### Get ECR URL

```bash
cd terraform
ECR_URL=$(terraform output -raw ecr_repository_url)
echo $ECR_URL
cd ..
```

### Build Docker Image

```bash
# Build image
docker build -t emtelaak-platform .

# Verify build
docker images | grep emtelaak
```

### Push to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URL

# Tag image
docker tag emtelaak-platform:latest $ECR_URL:latest
docker tag emtelaak-platform:latest $ECR_URL:$(git rev-parse --short HEAD)

# Push to ECR
docker push $ECR_URL:latest
docker push $ECR_URL:$(git rev-parse --short HEAD)
```

### Deploy to ECS

```bash
# Get ECS details
cd terraform
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
ECS_SERVICE=$(terraform output -raw ecs_service_name)
cd ..

# Force new deployment
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE
```

### Verify Deployment

```bash
# Get load balancer URL
cd terraform
ALB_DNS=$(terraform output -raw load_balancer_dns)
cd ..

# Test health endpoint
curl http://$ALB_DNS/health

# Expected response: {"status":"ok"}
```

---

## 🔐 Step 3: Configure SSL/TLS

### Option A: Automated Configuration

```bash
./scripts/configure-ssl.sh
```

Follow the prompts:
1. Enter your domain name
2. Add DNS validation records
3. Wait for certificate validation
4. Script configures HTTPS automatically

### Option B: Manual Configuration

#### 3.1 Request ACM Certificate

```bash
# Request certificate
CERT_ARN=$(aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names "*.yourdomain.com" \
  --validation-method DNS \
  --region us-east-1 \
  --query CertificateArn \
  --output text)

echo "Certificate ARN: $CERT_ARN"
```

#### 3.2 Get DNS Validation Records

```bash
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Type,ResourceRecord.Value]' \
  --output table
```

#### 3.3 Add DNS Records

Add the CNAME records to your domain's DNS:

**Example (Route 53):**
```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name yourdomain.com \
  --query 'HostedZones[0].Id' \
  --output text)

# Create validation record (get values from step 3.2)
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "_xxxxx.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "_xxxxx.acm-validations.aws."}]
      }
    }]
  }'
```

#### 3.4 Wait for Validation

```bash
aws acm wait certificate-validated \
  --certificate-arn $CERT_ARN \
  --region us-east-1

echo "Certificate validated!"
```

#### 3.5 Add HTTPS Listener to ALB

```bash
# Get ALB ARN
cd terraform
ALB_ARN=$(terraform output -raw alb_arn)
TARGET_GROUP_ARN=$(terraform output -raw target_group_arn)
cd ..

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN
```

#### 3.6 Configure HTTP to HTTPS Redirect

```bash
# Get HTTP listener ARN
HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[?Port==`80`].ListenerArn' \
  --output text)

# Modify to redirect
aws elbv2 modify-listener \
  --listener-arn $HTTP_LISTENER_ARN \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

#### 3.7 Point Domain to Load Balancer

**Route 53:**
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "'$ALB_DNS'",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

**Other DNS Providers:**
- Create an A record or CNAME pointing to `$ALB_DNS`

#### 3.8 Verify HTTPS

```bash
curl https://yourdomain.com/health
```

---

## 📊 Step 4: Set Up Monitoring

### Option A: Automated Setup

```bash
./scripts/setup-monitoring.sh
```

Enter your email for alarm notifications.

### Option B: Manual Setup

#### 4.1 Create SNS Topic

```bash
SNS_TOPIC_ARN=$(aws sns create-topic \
  --name emtelaak-prod-alarms \
  --query 'TopicArn' \
  --output text)

# Subscribe email
aws sns subscribe \
  --topic-arn $SNS_TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com

# Check email and confirm subscription
```

#### 4.2 Create CloudWatch Alarms

**High CPU Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name emtelaak-prod-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=$ECS_SERVICE Name=ClusterName,Value=$ECS_CLUSTER \
  --alarm-actions $SNS_TOPIC_ARN
```

**High Memory Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name emtelaak-prod-high-memory \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=$ECS_SERVICE Name=ClusterName,Value=$ECS_CLUSTER \
  --alarm-actions $SNS_TOPIC_ARN
```

**Unhealthy Targets Alarm:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name emtelaak-prod-unhealthy-targets \
  --alarm-description "Alert when targets are unhealthy" \
  --metric-name UnHealthyHostCount \
  --namespace AWS/ApplicationELB \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions $SNS_TOPIC_ARN
```

#### 4.3 View Logs

```bash
# Stream logs
aws logs tail /ecs/emtelaak-prod --follow

# Filter errors
aws logs tail /ecs/emtelaak-prod --follow --filter-pattern "ERROR"

# Last hour
aws logs tail /ecs/emtelaak-prod --since 1h
```

---

## 🔄 Step 5: Set Up CI/CD (GitHub Actions)

### 5.1 Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | AWS IAM Console |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | AWS IAM Console |
| `DATABASE_URL` | MySQL connection string | `terraform output database_url` |
| `JWT_SECRET` | JWT secret | `terraform output jwt_secret` |

### 5.2 Verify Workflow

```bash
# Check workflow file
cat .github/workflows/deploy.yml

# Push to main branch
git add .
git commit -m "Deploy to production"
git push origin main

# Monitor deployment
# Go to: https://github.com/your-repo/actions
```

### 5.3 Automated Deployment Flow

```
Push to main → Tests → Build Docker → Push to ECR → Deploy to ECS → Verify
```

---

## ✅ Step 6: Verify Production Deployment

### Health Checks

```bash
# Application health
curl https://yourdomain.com/health

# Readiness check
curl https://yourdomain.com/ready

# Test API
curl https://yourdomain.com/api/trpc/auth.me
```

### Check ECS Service

```bash
# Service status
aws ecs describe-services \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE

# Running tasks
aws ecs list-tasks \
  --cluster $ECS_CLUSTER \
  --service-name $ECS_SERVICE
```

### Check Database

```bash
# Database status
aws rds describe-db-instances \
  --db-instance-identifier emtelaak-prod-db
```

### Monitor Metrics

```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=$ECS_SERVICE \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

## 🎉 Success!

Your Emtelaak platform is now running in production!

### Access Points

- **Application:** https://yourdomain.com
- **Health Check:** https://yourdomain.com/health
- **Admin Panel:** https://yourdomain.com/admin
- **Super Admin:** https://yourdomain.com/super-admin

### AWS Console Links

- [ECS Dashboard](https://console.aws.amazon.com/ecs/)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/)
- [RDS Dashboard](https://console.aws.amazon.com/rds/)
- [Load Balancers](https://console.aws.amazon.com/ec2/v2/home#LoadBalancers)

---

## 🔧 Post-Deployment Tasks

### 1. Database Migrations

```bash
# Get running task
TASK_ARN=$(aws ecs list-tasks \
  --cluster $ECS_CLUSTER \
  --service-name $ECS_SERVICE \
  --desired-status RUNNING \
  --query 'taskArns[0]' \
  --output text)

# Run migrations
aws ecs execute-command \
  --cluster $ECS_CLUSTER \
  --task $TASK_ARN \
  --container app \
  --interactive \
  --command "pnpm db:push"
```

### 2. Create Admin User

```bash
# Connect to database
aws ecs execute-command \
  --cluster $ECS_CLUSTER \
  --task $TASK_ARN \
  --container app \
  --interactive \
  --command "/bin/sh"

# Inside container
mysql -h <DB_ENDPOINT> -u <DB_USER> -p

# Promote user to admin
UPDATE users SET role='admin' WHERE openId='your-open-id';
```

### 3. Configure Email (SendGrid)

Update environment variables in ECS task definition:
- `SMTP_HOST`: smtp.sendgrid.net
- `SMTP_USER`: apikey
- `SMTP_PASSWORD`: your-sendgrid-api-key

### 4. Set Up Backups

```bash
# Enable automated backups (RDS)
aws rds modify-db-instance \
  --db-instance-identifier emtelaak-prod-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

---

## 💰 Cost Breakdown

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS Fargate | 0.5 vCPU, 1GB RAM | ~$15 |
| RDS MySQL | db.t3.micro | ~$15 |
| Application Load Balancer | Standard | ~$20 |
| S3 Storage | 10GB | ~$0.23 |
| Data Transfer | 10GB | ~$0.90 |
| CloudWatch Logs | 5GB | ~$2.50 |
| **Total** | | **~$54/month** |

### Cost Optimization Tips

1. **Use Reserved Instances** for RDS (save 30-40%)
2. **Enable S3 Intelligent-Tiering** for automatic cost optimization
3. **Set up auto-scaling** to scale down during low traffic
4. **Use CloudFront CDN** for static assets (reduce data transfer costs)

---

## 🆘 Troubleshooting

See [RUNBOOK.md](./RUNBOOK.md) for detailed troubleshooting procedures.

### Quick Fixes

**Service won't start:**
```bash
aws logs tail /ecs/emtelaak-prod --follow
```

**Database connection failed:**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <SG_ID>
```

**High memory usage:**
```bash
# Scale up
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --desired-count 2
```

---

## 📞 Support

- **Documentation:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Operations:** [RUNBOOK.md](./RUNBOOK.md)
- **GitHub Issues:** [Report Issue](https://github.com/your-repo/issues)

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** November 30, 2024
