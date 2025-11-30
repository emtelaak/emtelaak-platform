# AWS Deployment Guide - Emtelaak Platform

Complete guide for deploying the Emtelaak platform to AWS infrastructure.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (`aws configure`)
- Docker installed (for local testing)
- Domain name (optional, for production)

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
# Development environment
./aws-setup.sh dev us-east-1

# Production environment
./aws-setup.sh prod us-east-1
```

This script will:
1. Create S3 bucket for file storage
2. Create IAM user with S3 access
3. Create RDS MySQL database
4. Create security group
5. Generate `.env` file with all credentials

### Option 2: Manual Setup

Follow the detailed steps below for manual configuration.

---

## Step-by-Step Deployment

### Step 1: Set Up S3 Storage

#### Create S3 Bucket

```bash
# Set variables
PROJECT_NAME="emtelaak"
ENVIRONMENT="dev"  # or "prod"
AWS_REGION="us-east-1"
BUCKET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-storage"

# Create bucket
aws s3 mb "s3://${BUCKET_NAME}" --region "${AWS_REGION}"

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket "${BUCKET_NAME}" \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket "${BUCKET_NAME}" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Block public access
aws s3api put-public-access-block \
    --bucket "${BUCKET_NAME}" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### Create IAM User for S3 Access

```bash
IAM_USER="${PROJECT_NAME}-${ENVIRONMENT}-app"

# Create user
aws iam create-user --user-name "${IAM_USER}"

# Create policy
POLICY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-s3-policy"
aws iam create-policy \
    --policy-name "${POLICY_NAME}" \
    --policy-document "{
        \"Version\": \"2012-10-17\",
        \"Statement\": [{
            \"Effect\": \"Allow\",
            \"Action\": [
                \"s3:PutObject\",
                \"s3:GetObject\",
                \"s3:DeleteObject\",
                \"s3:ListBucket\"
            ],
            \"Resource\": [
                \"arn:aws:s3:::${BUCKET_NAME}/*\",
                \"arn:aws:s3:::${BUCKET_NAME}\"
            ]
        }]
    }"

# Attach policy to user
POLICY_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/${POLICY_NAME}"
aws iam attach-user-policy \
    --user-name "${IAM_USER}" \
    --policy-arn "${POLICY_ARN}"

# Create access keys
aws iam create-access-key --user-name "${IAM_USER}"
```

**Save the Access Key ID and Secret Access Key** - you'll need them for the `.env` file.

---

### Step 2: Set Up RDS MySQL Database

#### Create RDS Instance

```bash
DB_INSTANCE_ID="${PROJECT_NAME}-${ENVIRONMENT}-db"
DB_NAME="emtelaak_${ENVIRONMENT}"
DB_USERNAME="emtelaak_admin"
DB_PASSWORD="$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-25)"

# Development instance
aws rds create-db-instance \
    --db-instance-identifier "${DB_INSTANCE_ID}" \
    --db-instance-class db.t3.medium \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username "${DB_USERNAME}" \
    --master-user-password "${DB_PASSWORD}" \
    --allocated-storage 100 \
    --storage-type gp3 \
    --storage-encrypted \
    --backup-retention-period 7 \
    --db-name "${DB_NAME}" \
    --publicly-accessible \
    --no-multi-az

# Wait for database to be available (10-15 minutes)
aws rds wait db-instance-available --db-instance-identifier "${DB_INSTANCE_ID}"

# Get endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "${DB_INSTANCE_ID}" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "DATABASE_URL=mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:3306/${DB_NAME}"
```

**Save the DATABASE_URL** - you'll need it for the `.env` file.

#### Configure Security Group

```bash
# Get RDS security group
RDS_SG_ID=$(aws rds describe-db-instances \
    --db-instance-identifier "${DB_INSTANCE_ID}" \
    --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text)

# Allow access from your IP (for migrations)
MY_IP=$(curl -s https://checkip.amazonaws.com)
aws ec2 authorize-security-group-ingress \
    --group-id "${RDS_SG_ID}" \
    --protocol tcp \
    --port 3306 \
    --cidr "${MY_IP}/32"
```

---

### Step 3: Deploy Application

#### Option A: EC2 Deployment

**1. Create EC2 Instance**

```bash
# Create key pair
aws ec2 create-key-pair \
    --key-name "${PROJECT_NAME}-${ENVIRONMENT}-key" \
    --query 'KeyMaterial' \
    --output text > "${PROJECT_NAME}-${ENVIRONMENT}-key.pem"

chmod 400 "${PROJECT_NAME}-${ENVIRONMENT}-key.pem"

# Create security group
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
SG_ID=$(aws ec2 create-security-group \
    --group-name "${PROJECT_NAME}-${ENVIRONMENT}-sg" \
    --description "Security group for ${PROJECT_NAME}" \
    --vpc-id "${VPC_ID}" \
    --query 'GroupId' \
    --output text)

# Add inbound rules
aws ec2 authorize-security-group-ingress \
    --group-id "${SG_ID}" \
    --ip-permissions \
        IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges='[{CidrIp=0.0.0.0/0}]' \
        IpProtocol=tcp,FromPort=3000,ToPort=3000,IpRanges='[{CidrIp=0.0.0.0/0}]'

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0c55b159cbfafe1f0 \
    --instance-type t3.medium \
    --key-name "${PROJECT_NAME}-${ENVIRONMENT}-key" \
    --security-group-ids "${SG_ID}" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${PROJECT_NAME}-${ENVIRONMENT}}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids "${INSTANCE_ID}"

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "${INSTANCE_ID}" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "Instance IP: ${PUBLIC_IP}"
```

**2. Connect and Deploy**

```bash
# Connect to instance
ssh -i "${PROJECT_NAME}-${ENVIRONMENT}-key.pem" ubuntu@${PUBLIC_IP}

# On the instance:
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/emtelaak/emtelaak-platform.git
cd emtelaak-platform

# Create .env file
nano .env

# Build and run
docker build -t emtelaak-platform .
docker run -d -p 3000:3000 --env-file .env --name emtelaak-app emtelaak-platform
```

#### Option B: ECS Fargate Deployment

**1. Create ECR Repository**

```bash
# Create repository
aws ecr create-repository --repository-name "${PROJECT_NAME}-${ENVIRONMENT}"

# Get repository URI
REPO_URI=$(aws ecr describe-repositories \
    --repository-names "${PROJECT_NAME}-${ENVIRONMENT}" \
    --query 'repositories[0].repositoryUri' \
    --output text)

# Login to ECR
aws ecr get-login-password --region "${AWS_REGION}" | \
    docker login --username AWS --password-stdin "${REPO_URI}"

# Build and push image
docker build -t "${PROJECT_NAME}-${ENVIRONMENT}" .
docker tag "${PROJECT_NAME}-${ENVIRONMENT}:latest" "${REPO_URI}:latest"
docker push "${REPO_URI}:latest"
```

**2. Create ECS Cluster**

```bash
# Create cluster
aws ecs create-cluster --cluster-name "${PROJECT_NAME}-${ENVIRONMENT}"

# Create task definition (save as task-definition.json)
cat > task-definition.json <<EOF
{
  "family": "${PROJECT_NAME}-${ENVIRONMENT}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [{
    "name": "app",
    "image": "${REPO_URI}:latest",
    "portMappings": [{
      "containerPort": 3000,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "${ENVIRONMENT}"}
    ],
    "secrets": [
      {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
      {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/${PROJECT_NAME}-${ENVIRONMENT}",
        "awslogs-region": "${AWS_REGION}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
    --cluster "${PROJECT_NAME}-${ENVIRONMENT}" \
    --service-name "${PROJECT_NAME}-${ENVIRONMENT}" \
    --task-definition "${PROJECT_NAME}-${ENVIRONMENT}" \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[${SG_ID}],assignPublicIp=ENABLED}"
```

---

### Step 4: Run Database Migrations

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm db:push
```

---

### Step 5: Configure Domain and SSL

#### Using AWS Certificate Manager

```bash
# Request certificate
CERT_ARN=$(aws acm request-certificate \
    --domain-name "emtelaak.com" \
    --subject-alternative-names "*.emtelaak.com" \
    --validation-method DNS \
    --query 'CertificateArn' \
    --output text)

# Get validation records
aws acm describe-certificate --certificate-arn "${CERT_ARN}"
```

Add the CNAME records to your DNS provider, then wait for validation.

#### Create Application Load Balancer

```bash
# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name "${PROJECT_NAME}-${ENVIRONMENT}-alb" \
    --subnets subnet-xxx subnet-yyy \
    --security-groups "${SG_ID}" \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
    --name "${PROJECT_NAME}-${ENVIRONMENT}-tg" \
    --protocol HTTP \
    --port 3000 \
    --vpc-id "${VPC_ID}" \
    --health-check-path "/api/health" \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Create HTTPS listener
aws elbv2 create-listener \
    --load-balancer-arn "${ALB_ARN}" \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn="${CERT_ARN}" \
    --default-actions Type=forward,TargetGroupArn="${TG_ARN}"

# Create HTTP to HTTPS redirect
aws elbv2 create-listener \
    --load-balancer-arn "${ALB_ARN}" \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=mysql://username:password@rds-endpoint:3306/database

# JWT
JWT_SECRET=your-super-secret-jwt-key

# S3 Storage
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
S3_REGION=us-east-1
S3_BUCKET=emtelaak-dev-storage
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key

# Email (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform

# Stripe
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-key

# Application
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=Emtelaak Platform
VITE_APP_LOGO=/logo.png
```

---

## Monitoring and Logging

### CloudWatch Logs

```bash
# Create log group
aws logs create-log-group --log-group-name "/aws/ecs/${PROJECT_NAME}-${ENVIRONMENT}"

# Set retention
aws logs put-retention-policy \
    --log-group-name "/aws/ecs/${PROJECT_NAME}-${ENVIRONMENT}" \
    --retention-in-days 30
```

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-high-cpu" \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold

# Memory utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-high-memory" \
    --alarm-description "Alert when memory exceeds 80%" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold
```

---

## Backup and Disaster Recovery

### RDS Automated Backups

Backups are configured automatically with 7-day retention. To create manual snapshot:

```bash
aws rds create-db-snapshot \
    --db-instance-identifier "${DB_INSTANCE_ID}" \
    --db-snapshot-identifier "${DB_INSTANCE_ID}-manual-$(date +%Y%m%d)"
```

### S3 Versioning

Versioning is enabled on the S3 bucket. To restore a file:

```bash
aws s3api list-object-versions --bucket "${BUCKET_NAME}" --prefix "path/to/file"
aws s3api get-object --bucket "${BUCKET_NAME}" --key "path/to/file" --version-id "version-id" restored-file
```

---

## Cost Optimization

### Development Environment (~$150/month)
- RDS db.t3.medium: ~$60/month
- EC2 t3.medium: ~$30/month
- S3 storage (100GB): ~$2/month
- Data transfer: ~$10/month
- Miscellaneous: ~$48/month

### Production Environment (~$500/month)
- RDS db.r5.large Multi-AZ: ~$300/month
- ECS Fargate (2 tasks): ~$100/month
- ALB: ~$20/month
- S3 storage (500GB): ~$12/month
- Data transfer: ~$50/month
- Miscellaneous: ~$18/month

### Cost Reduction Tips
1. Use Reserved Instances for RDS (save 40-60%)
2. Enable S3 Intelligent-Tiering
3. Use Spot Instances for non-critical workloads
4. Set up auto-scaling to match demand
5. Enable CloudWatch cost anomaly detection

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
mysql -h ${DB_ENDPOINT} -u ${DB_USERNAME} -p

# Check security group
aws ec2 describe-security-groups --group-ids "${RDS_SG_ID}"
```

### Application Not Starting

```bash
# Check logs
docker logs emtelaak-app

# Or for ECS
aws logs tail "/aws/ecs/${PROJECT_NAME}-${ENVIRONMENT}" --follow
```

### S3 Access Issues

```bash
# Test S3 access
aws s3 ls "s3://${BUCKET_NAME}"

# Check IAM permissions
aws iam get-user-policy --user-name "${IAM_USER}" --policy-name "${POLICY_NAME}"
```

---

## Security Best Practices

1. **Enable MFA** on AWS root account
2. **Rotate credentials** regularly (90 days)
3. **Use AWS Secrets Manager** for sensitive data
4. **Enable CloudTrail** for audit logging
5. **Use VPC** with private subnets for database
6. **Enable WAF** on Application Load Balancer
7. **Set up Security Hub** for compliance monitoring
8. **Enable GuardDuty** for threat detection

---

## Next Steps

1. Set up CI/CD pipeline (see `.github/workflows/deploy.yml`)
2. Configure monitoring and alerting
3. Set up automated backups
4. Configure auto-scaling
5. Set up staging environment
6. Implement blue-green deployment

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/emtelaak/emtelaak-platform/issues
- Email: support@emtelaak.com
