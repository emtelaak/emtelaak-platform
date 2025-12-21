#!/bin/bash

# Emtelaak Platform - AWS Free Tier Deployment
# Deploys using free tier eligible resources to minimize costs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_REGION="${1:-us-east-1}"
PROJECT_NAME="emtelaak"
ENVIRONMENT="dev"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║     Emtelaak Platform - AWS Free Tier Deployment          ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Region:${NC} ${YELLOW}${AWS_REGION}${NC}"
echo -e "${GREEN}Free Tier Resources:${NC}"
echo -e "  • EC2: t2.micro (750 hours/month free)"
echo -e "  • RDS: db.t3.micro (750 hours/month free)"
echo -e "  • S3: 5GB storage free"
echo -e "  • EBS: 20GB free"
echo ""
echo -e "${YELLOW}Estimated Cost: \$0-5/month${NC}"
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

# Create SSH key pair
echo -e "${BLUE}[2/8] Setting up SSH key pair...${NC}"
KEY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-key"

if ! aws ec2 describe-key-pairs --key-names "${KEY_NAME}" --region "${AWS_REGION}" &> /dev/null; then
    echo "Creating new key pair..."
    aws ec2 create-key-pair \
        --key-name "${KEY_NAME}" \
        --region "${AWS_REGION}" \
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

# Use free tier configuration
if [ ! -f "terraform.tfvars" ]; then
    cat > terraform.tfvars <<EOF
aws_region        = "${AWS_REGION}"
project_name      = "${PROJECT_NAME}"
environment       = "${ENVIRONMENT}"
ec2_key_name      = "${KEY_NAME}"

# Free Tier Configuration
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_multi_az          = false
ec2_instance_type    = "t2.micro"

# SendGrid Configuration (add your key here)
# smtp_password = "your-sendgrid-api-key"
EOF
    echo -e "${GREEN}✓ Created terraform.tfvars with free tier settings${NC}"
fi

terraform init
echo -e "${GREEN}✓ Terraform initialized${NC}"
echo ""

# Plan
echo -e "${BLUE}[4/8] Planning infrastructure...${NC}"
terraform plan -out=tfplan
echo -e "${GREEN}✓ Plan created${NC}"
echo ""

# Confirm
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Free Tier Resources to Deploy:${NC}"
echo -e "${YELLOW}  • VPC with subnets (Free)${NC}"
echo -e "${YELLOW}  • S3 bucket - 5GB free (Free)${NC}"
echo -e "${YELLOW}  • RDS db.t3.micro - 750 hrs/month (Free)${NC}"
echo -e "${YELLOW}  • EC2 t2.micro - 750 hrs/month (Free)${NC}"
echo -e "${YELLOW}  • 20GB EBS storage (Free)${NC}"
echo -e "${YELLOW}  • NAT Gateway (~\$32/month - NOT FREE)${NC}"
echo ""
echo -e "${YELLOW}Note: NAT Gateway is required for private subnet internet access${NC}"
echo -e "${YELLOW}To avoid NAT Gateway costs, use public subnet for RDS (less secure)${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Apply
echo -e "${BLUE}[5/8] Deploying infrastructure (10-15 minutes)...${NC}"
terraform apply tfplan
echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo ""

# Get outputs
echo -e "${BLUE}[6/8] Retrieving deployment information...${NC}"
EC2_IP=$(terraform output -raw ec2_public_ip)
DB_ENDPOINT=$(terraform output -raw database_endpoint)
S3_BUCKET=$(terraform output -raw s3_bucket)

echo -e "${GREEN}✓ EC2 Public IP:${NC} ${EC2_IP}"
echo -e "${GREEN}✓ Database Endpoint:${NC} ${DB_ENDPOINT}"
echo -e "${GREEN}✓ S3 Bucket:${NC} ${S3_BUCKET}"
echo ""

# Save credentials
echo -e "${BLUE}[7/8] Saving credentials...${NC}"
terraform output -json > ../deployment-outputs.json
echo -e "${GREEN}✓ Credentials saved${NC}"
echo ""

# Wait for application
echo -e "${BLUE}[8/8] Waiting for application (5-10 minutes)...${NC}"
echo "Application is being deployed..."

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if ssh -i "../${KEY_NAME}.pem" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "test -f /home/ubuntu/deployment-complete" 2>/dev/null; then
        echo -e "${GREEN}✓ Application ready${NC}"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "."
    sleep 10
done
echo ""

# Success
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║         🎉 FREE TIER DEPLOYMENT SUCCESSFUL! 🎉             ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo -e "  ${GREEN}URL:${NC} http://${EC2_IP}:3000"
echo -e "  ${GREEN}SSH:${NC} ssh -i ${KEY_NAME}.pem ubuntu@${EC2_IP}"
echo ""
echo -e "${YELLOW}⚠ COST REMINDER:${NC}"
echo -e "  • Free tier includes 750 hours/month (31 days)"
echo -e "  • NAT Gateway costs ~\$32/month (not free)"
echo -e "  • Data transfer over 1GB/month costs extra"
echo -e "  • Total estimated: \$32-40/month"
echo ""
echo -e "${BLUE}To minimize costs:${NC}"
echo -e "  • Stop EC2 when not in use: ${BLUE}aws ec2 stop-instances --instance-ids <id>${NC}"
echo -e "  • Delete NAT Gateway if not needed (reduces security)"
echo -e "  • Monitor usage in AWS Cost Explorer"
echo ""
echo -e "${GREEN}Deployment completed at $(date)${NC}"
