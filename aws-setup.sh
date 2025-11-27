#!/bin/bash

# Emtelaak Platform - AWS Infrastructure Setup Script
# This script sets up all required AWS resources for the platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="emtelaak"
ENVIRONMENT="${1:-dev}"  # dev, staging, or prod
AWS_REGION="${2:-us-east-1}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Emtelaak AWS Infrastructure Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${AWS_REGION}${NC}"
echo ""

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI configured${NC}"
echo ""

# Step 1: Create S3 Bucket
echo -e "${YELLOW}Step 1: Creating S3 Bucket...${NC}"
BUCKET_NAME="${PROJECT_NAME}-${ENVIRONMENT}-storage"

if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://${BUCKET_NAME}" --region "${AWS_REGION}"
    echo -e "${GREEN}✓ S3 bucket created: ${BUCKET_NAME}${NC}"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled
    echo -e "${GREEN}✓ Versioning enabled${NC}"
    
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
    echo -e "${GREEN}✓ Encryption enabled${NC}"
    
    # Block public access
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration \
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    echo -e "${GREEN}✓ Public access blocked${NC}"
    
    # Set lifecycle policy
    aws s3api put-bucket-lifecycle-configuration \
        --bucket "${BUCKET_NAME}" \
        --lifecycle-configuration '{
            "Rules": [{
                "Id": "ArchiveOldFiles",
                "Status": "Enabled",
                "Transitions": [{
                    "Days": 90,
                    "StorageClass": "GLACIER"
                }],
                "NoncurrentVersionTransitions": [{
                    "NoncurrentDays": 30,
                    "StorageClass": "GLACIER"
                }]
            }]
        }'
    echo -e "${GREEN}✓ Lifecycle policy configured${NC}"
else
    echo -e "${YELLOW}S3 bucket already exists: ${BUCKET_NAME}${NC}"
fi
echo ""

# Step 2: Create IAM User for S3 Access
echo -e "${YELLOW}Step 2: Creating IAM User...${NC}"
IAM_USER="${PROJECT_NAME}-${ENVIRONMENT}-app"

if ! aws iam get-user --user-name "${IAM_USER}" &> /dev/null; then
    aws iam create-user --user-name "${IAM_USER}"
    echo -e "${GREEN}✓ IAM user created: ${IAM_USER}${NC}"
    
    # Create and attach policy
    POLICY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-s3-policy"
    POLICY_ARN=$(aws iam create-policy \
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
        }" \
        --query 'Policy.Arn' \
        --output text 2>/dev/null || echo "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/${POLICY_NAME}")
    
    aws iam attach-user-policy \
        --user-name "${IAM_USER}" \
        --policy-arn "${POLICY_ARN}"
    echo -e "${GREEN}✓ S3 policy attached${NC}"
    
    # Create access keys
    ACCESS_KEYS=$(aws iam create-access-key --user-name "${IAM_USER}" --output json)
    ACCESS_KEY_ID=$(echo "${ACCESS_KEYS}" | grep -o '"AccessKeyId": "[^"]*' | cut -d'"' -f4)
    SECRET_ACCESS_KEY=$(echo "${ACCESS_KEYS}" | grep -o '"SecretAccessKey": "[^"]*' | cut -d'"' -f4)
    
    echo -e "${GREEN}✓ Access keys created${NC}"
    echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}"
    echo "S3_ACCESS_KEY_ID=${ACCESS_KEY_ID}"
    echo "S3_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}"
    echo ""
else
    echo -e "${YELLOW}IAM user already exists: ${IAM_USER}${NC}"
fi
echo ""

# Step 3: Create RDS MySQL Database
echo -e "${YELLOW}Step 3: Creating RDS MySQL Database...${NC}"
DB_INSTANCE_ID="${PROJECT_NAME}-${ENVIRONMENT}-db"
DB_NAME="emtelaak_${ENVIRONMENT}"
DB_USERNAME="emtelaak_admin"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Determine instance class based on environment
if [ "${ENVIRONMENT}" = "prod" ]; then
    DB_INSTANCE_CLASS="db.r5.large"
    MULTI_AZ="--multi-az"
else
    DB_INSTANCE_CLASS="db.t3.medium"
    MULTI_AZ="--no-multi-az"
fi

if ! aws rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" &> /dev/null; then
    echo "Creating RDS instance (this may take 10-15 minutes)..."
    
    aws rds create-db-instance \
        --db-instance-identifier "${DB_INSTANCE_ID}" \
        --db-instance-class "${DB_INSTANCE_CLASS}" \
        --engine mysql \
        --engine-version 8.0.35 \
        --master-username "${DB_USERNAME}" \
        --master-user-password "${DB_PASSWORD}" \
        --allocated-storage 100 \
        --storage-type gp3 \
        --storage-encrypted \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --preferred-maintenance-window "mon:04:00-mon:05:00" \
        --db-name "${DB_NAME}" \
        --publicly-accessible \
        ${MULTI_AZ} \
        --tags "Key=Project,Value=${PROJECT_NAME}" "Key=Environment,Value=${ENVIRONMENT}"
    
    echo -e "${GREEN}✓ RDS instance creation initiated${NC}"
    echo "Waiting for database to become available..."
    
    aws rds wait db-instance-available --db-instance-identifier "${DB_INSTANCE_ID}"
    
    # Get endpoint
    DB_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier "${DB_INSTANCE_ID}" \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    
    echo -e "${GREEN}✓ Database is ready${NC}"
    echo -e "${YELLOW}IMPORTANT: Save these database credentials securely!${NC}"
    echo "DATABASE_URL=mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:3306/${DB_NAME}"
    echo ""
else
    echo -e "${YELLOW}RDS instance already exists: ${DB_INSTANCE_ID}${NC}"
    DB_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier "${DB_INSTANCE_ID}" \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    echo "Endpoint: ${DB_ENDPOINT}"
fi
echo ""

# Step 4: Create Security Group for EC2/ECS
echo -e "${YELLOW}Step 4: Creating Security Group...${NC}"
SG_NAME="${PROJECT_NAME}-${ENVIRONMENT}-sg"

# Get default VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)

# Check if security group exists
SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${SG_NAME}" "Name=vpc-id,Values=${VPC_ID}" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "${SG_ID}" = "None" ]; then
    SG_ID=$(aws ec2 create-security-group \
        --group-name "${SG_NAME}" \
        --description "Security group for ${PROJECT_NAME} ${ENVIRONMENT}" \
        --vpc-id "${VPC_ID}" \
        --query 'GroupId' \
        --output text)
    
    echo -e "${GREEN}✓ Security group created: ${SG_ID}${NC}"
    
    # Add inbound rules
    aws ec2 authorize-security-group-ingress \
        --group-id "${SG_ID}" \
        --ip-permissions \
            IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges='[{CidrIp=0.0.0.0/0,Description="SSH"}]' \
            IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=0.0.0.0/0,Description="HTTP"}]' \
            IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges='[{CidrIp=0.0.0.0/0,Description="HTTPS"}]' \
            IpProtocol=tcp,FromPort=3000,ToPort=3000,IpRanges='[{CidrIp=0.0.0.0/0,Description="App"}]'
    
    echo -e "${GREEN}✓ Inbound rules configured${NC}"
else
    echo -e "${YELLOW}Security group already exists: ${SG_ID}${NC}"
fi
echo ""

# Step 5: Generate .env file
echo -e "${YELLOW}Step 5: Generating .env.${ENVIRONMENT} file...${NC}"

cat > ".env.${ENVIRONMENT}" <<EOF
# Emtelaak Platform - ${ENVIRONMENT} Environment Configuration
# Generated on $(date)

# Database
DATABASE_URL=mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:3306/${DB_NAME}

# JWT Authentication
JWT_SECRET=$(openssl rand -base64 32)

# S3 Storage
S3_ENDPOINT=https://s3.${AWS_REGION}.amazonaws.com
S3_REGION=${AWS_REGION}
S3_BUCKET=${BUCKET_NAME}
S3_ACCESS_KEY_ID=${ACCESS_KEY_ID:-your-access-key-id}
S3_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY:-your-secret-access-key}

# Application
NODE_ENV=${ENVIRONMENT}
PORT=3000
VITE_APP_TITLE=Emtelaak Platform
VITE_APP_LOGO=/logo.png

# Email (SendGrid) - Configure these manually
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform

# Stripe - Configure these manually
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key

# OAuth (if using Manus OAuth) - Configure these manually
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Your Name

# AWS Configuration
AWS_REGION=${AWS_REGION}
SECURITY_GROUP_ID=${SG_ID}
EOF

echo -e "${GREEN}✓ Environment file created: .env.${ENVIRONMENT}${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Infrastructure Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Resources Created:${NC}"
echo "  • S3 Bucket: ${BUCKET_NAME}"
echo "  • IAM User: ${IAM_USER}"
echo "  • RDS Instance: ${DB_INSTANCE_ID}"
echo "  • Security Group: ${SG_ID}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review and update .env.${ENVIRONMENT} with your SendGrid and Stripe credentials"
echo "  2. Run database migrations: pnpm db:push"
echo "  3. Deploy application using Docker or EC2"
echo "  4. Configure domain and SSL certificate"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  • .env.${ENVIRONMENT} - Environment configuration (DO NOT COMMIT)"
echo "  • Dockerfile - Container configuration"
echo "  • docker-compose.yml - Local testing"
echo ""
echo -e "${RED}Security Reminder:${NC}"
echo "  • Never commit .env files to version control"
echo "  • Store credentials in AWS Secrets Manager or Parameter Store"
echo "  • Enable MFA on AWS account"
echo "  • Regularly rotate access keys"
echo ""
