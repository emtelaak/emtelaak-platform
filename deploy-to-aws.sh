#!/bin/bash

# Emtelaak Platform - One-Command AWS Deployment
# This script handles EVERYTHING: infrastructure setup, deployment, and verification

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-dev}"
AWS_REGION="${2:-us-east-1}"
PROJECT_NAME="emtelaak"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║        Emtelaak Platform - AWS Deployment Script          ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Environment:${NC} ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "${GREEN}Region:${NC} ${YELLOW}${AWS_REGION}${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}[1/8] Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found${NC}"
    echo "Install from: https://aws.amazon.com/cli/"
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI installed${NC}"

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}✗ Terraform not found${NC}"
    echo "Install from: https://www.terraform.io/downloads"
    exit 1
fi
echo -e "${GREEN}✓ Terraform installed${NC}"

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}✗ AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi
echo -e "${GREEN}✓ AWS credentials configured${NC}"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account:${NC} ${AWS_ACCOUNT_ID}"
echo ""

# Create SSH key pair if it doesn't exist
echo -e "${BLUE}[2/8] Setting up SSH key pair...${NC}"
KEY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-key"

if ! aws ec2 describe-key-pairs --key-names "${KEY_NAME}" &> /dev/null; then
    echo "Creating new key pair..."
    aws ec2 create-key-pair \
        --key-name "${KEY_NAME}" \
        --query 'KeyMaterial' \
        --output text > "${KEY_NAME}.pem"
    chmod 400 "${KEY_NAME}.pem"
    echo -e "${GREEN}✓ Key pair created: ${KEY_NAME}.pem${NC}"
else
    echo -e "${YELLOW}Key pair already exists: ${KEY_NAME}${NC}"
fi
echo ""

# Initialize Terraform
echo -e "${BLUE}[3/8] Initializing Terraform...${NC}"
cd terraform

if [ ! -f "terraform.tfvars" ]; then
    cat > terraform.tfvars <<EOF
aws_region        = "${AWS_REGION}"
project_name      = "${PROJECT_NAME}"
environment       = "${ENVIRONMENT}"
ec2_key_name      = "${KEY_NAME}"
db_multi_az       = false

# Optional: Add your SendGrid and Stripe keys here
# smtp_password         = "your-sendgrid-api-key"
# stripe_secret_key     = "sk_test_your-key"
# stripe_publishable_key = "pk_test_your-key"
EOF
    echo -e "${GREEN}✓ Created terraform.tfvars${NC}"
fi

terraform init
echo -e "${GREEN}✓ Terraform initialized${NC}"
echo ""

# Plan infrastructure
echo -e "${BLUE}[4/8] Planning infrastructure...${NC}"
terraform plan -out=tfplan
echo -e "${GREEN}✓ Plan created${NC}"
echo ""

# Confirm deployment
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Ready to deploy the following resources:${NC}"
echo -e "${YELLOW}  • VPC with public and private subnets${NC}"
echo -e "${YELLOW}  • S3 bucket for file storage${NC}"
echo -e "${YELLOW}  • RDS MySQL database (db.t3.medium, 100GB)${NC}"
echo -e "${YELLOW}  • EC2 instance (t3.medium) with application${NC}"
echo -e "${YELLOW}  • IAM user with S3 access${NC}"
echo -e "${YELLOW}  • Security groups and networking${NC}"
echo ""
echo -e "${YELLOW}Estimated cost: ~\$150/month for development${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Apply infrastructure
echo -e "${BLUE}[5/8] Deploying infrastructure (this will take 10-15 minutes)...${NC}"
terraform apply tfplan
echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo ""

# Get outputs
echo -e "${BLUE}[6/8] Retrieving deployment information...${NC}"
EC2_IP=$(terraform output -raw ec2_public_ip)
DB_ENDPOINT=$(terraform output -raw database_endpoint)
S3_BUCKET=$(terraform output -raw s3_bucket)
APP_URL=$(terraform output -raw application_url)

echo -e "${GREEN}✓ EC2 Public IP:${NC} ${EC2_IP}"
echo -e "${GREEN}✓ Database Endpoint:${NC} ${DB_ENDPOINT}"
echo -e "${GREEN}✓ S3 Bucket:${NC} ${S3_BUCKET}"
echo ""

# Save credentials
echo -e "${BLUE}[7/8] Saving credentials...${NC}"
terraform output -json > ../deployment-outputs.json

cat > ../.env.${ENVIRONMENT} <<EOF
# Emtelaak Platform - ${ENVIRONMENT} Environment
# Generated on $(date)

DATABASE_URL=$(terraform output -raw database_endpoint | sed 's/.*@/mysql:\/\/emtelaak_admin:'"$(terraform output -raw database_password)"'@/')
JWT_SECRET=$(terraform output -raw jwt_secret)

S3_ENDPOINT=https://s3.${AWS_REGION}.amazonaws.com
S3_REGION=${AWS_REGION}
S3_BUCKET=$(terraform output -raw s3_bucket)
S3_ACCESS_KEY_ID=$(terraform output -raw s3_access_key_id)
S3_SECRET_ACCESS_KEY=$(terraform output -raw s3_secret_access_key)

NODE_ENV=${ENVIRONMENT}
PORT=3000
VITE_APP_TITLE=Emtelaak Platform
VITE_APP_LOGO=/logo.png

# Email (SendGrid) - CONFIGURE THESE MANUALLY
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=REPLACE_WITH_YOUR_SENDGRID_KEY
SMTP_FROM_EMAIL=noreply@emtelaak.com
SMTP_FROM_NAME=Emtelaak Platform

# Stripe - CONFIGURE THESE MANUALLY
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_YOUR_SECRET
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_KEY
EOF

echo -e "${GREEN}✓ Credentials saved to .env.${ENVIRONMENT}${NC}"
echo ""

# Wait for application to be ready
echo -e "${BLUE}[8/8] Waiting for application to be ready...${NC}"
echo "This may take 5-10 minutes for initial setup..."

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if ssh -i "../${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "test -f /home/ubuntu/deployment-complete" 2>/dev/null; then
        echo -e "${GREEN}✓ Application deployment complete${NC}"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 10
done
echo ""

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠ Deployment is taking longer than expected${NC}"
    echo "Check logs with: ssh -i ${KEY_NAME}.pem ubuntu@${EC2_IP} 'tail -f /home/ubuntu/deployment-log.txt'"
fi
echo ""

# Final health check
echo -e "${BLUE}Performing health check...${NC}"
sleep 30  # Give the service time to start

if curl -s -o /dev/null -w "%{http_code}" "http://${EC2_IP}:3000" | grep -q "200\|302"; then
    echo -e "${GREEN}✓ Application is responding${NC}"
else
    echo -e "${YELLOW}⚠ Application may still be starting${NC}"
fi
echo ""

# Success summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║              🎉 DEPLOYMENT SUCCESSFUL! 🎉                  ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo -e "  ${GREEN}URL:${NC} ${APP_URL}"
echo -e "  ${GREEN}SSH:${NC} ssh -i ${KEY_NAME}.pem ubuntu@${EC2_IP}"
echo ""
echo -e "${BLUE}Important files:${NC}"
echo -e "  ${GREEN}Credentials:${NC} .env.${ENVIRONMENT}"
echo -e "  ${GREEN}SSH Key:${NC} ${KEY_NAME}.pem"
echo -e "  ${GREEN}Outputs:${NC} deployment-outputs.json"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT NEXT STEPS:${NC}"
echo -e "  1. Update .env.${ENVIRONMENT} with your SendGrid and Stripe keys"
echo -e "  2. SSH to server and restart application:"
echo -e "     ${BLUE}ssh -i ${KEY_NAME}.pem ubuntu@${EC2_IP}${NC}"
echo -e "     ${BLUE}sudo systemctl restart emtelaak${NC}"
echo -e "  3. Configure your domain DNS to point to: ${EC2_IP}"
echo -e "  4. Set up SSL certificate (see docs/AWS_DEPLOYMENT.md)"
echo ""
echo -e "${RED}🔒 SECURITY REMINDERS:${NC}"
echo -e "  • Store ${KEY_NAME}.pem securely (never commit to git)"
echo -e "  • Store .env.${ENVIRONMENT} securely (never commit to git)"
echo -e "  • Enable MFA on your AWS account"
echo -e "  • Regularly rotate access keys"
echo ""
echo -e "${GREEN}Deployment completed at $(date)${NC}"
echo ""
