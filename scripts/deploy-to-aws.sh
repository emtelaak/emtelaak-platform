#!/bin/bash

# Emtelaak Platform - AWS Deployment Script
# This script deploys the complete infrastructure to AWS

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="emtelaak"
ENVIRONMENT="${ENVIRONMENT:-prod}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Emtelaak Platform - AWS Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo ""

# Step 1: Deploy Infrastructure
echo -e "${YELLOW}Step 1: Deploying AWS Infrastructure...${NC}"
cd terraform

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Create terraform.tfvars if it doesn't exist
if [ ! -f terraform.tfvars ]; then
    echo -e "${YELLOW}Creating terraform.tfvars...${NC}"
    cat > terraform.tfvars <<EOF
aws_region       = "${AWS_REGION}"
project_name     = "${PROJECT_NAME}"
environment      = "${ENVIRONMENT}"
vpc_cidr         = "10.0.0.0/16"

# Database
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_name              = "emtelaak_${ENVIRONMENT}"
db_username          = "emtelaak_admin"
db_multi_az          = false

# EC2 (if using EC2 module)
ec2_instance_type = "t3.micro"
ec2_key_name      = "emtelaak-${ENVIRONMENT}"
EOF
    echo -e "${GREEN}✓ Created terraform.tfvars${NC}"
fi

# Plan
echo "Planning infrastructure changes..."
terraform plan -out=tfplan

# Ask for confirmation
echo ""
read -p "Do you want to apply these changes? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

# Apply
echo "Applying infrastructure changes..."
terraform apply tfplan

echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo ""

# Get outputs
ECR_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null || echo "")
ECS_SERVICE=$(terraform output -raw ecs_service_name 2>/dev/null || echo "")
ALB_DNS=$(terraform output -raw load_balancer_dns 2>/dev/null || echo "")

cd ..

# Step 2: Build and Push Docker Image
if [ -n "$ECR_URL" ]; then
    echo -e "${YELLOW}Step 2: Building and pushing Docker image...${NC}"
    
    # Login to ECR
    echo "Logging in to ECR..."
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${ECR_URL}
    
    # Build image
    echo "Building Docker image..."
    docker build -t ${PROJECT_NAME}-${ENVIRONMENT} .
    
    # Tag image
    IMAGE_TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    docker tag ${PROJECT_NAME}-${ENVIRONMENT}:latest ${ECR_URL}:${IMAGE_TAG}
    docker tag ${PROJECT_NAME}-${ENVIRONMENT}:latest ${ECR_URL}:latest
    
    # Push image
    echo "Pushing Docker image to ECR..."
    docker push ${ECR_URL}:${IMAGE_TAG}
    docker push ${ECR_URL}:latest
    
    echo -e "${GREEN}✓ Docker image pushed${NC}"
    echo ""
fi

# Step 3: Deploy to ECS
if [ -n "$ECS_CLUSTER" ] && [ -n "$ECS_SERVICE" ]; then
    echo -e "${YELLOW}Step 3: Deploying to ECS Fargate...${NC}"
    
    aws ecs update-service \
        --cluster ${ECS_CLUSTER} \
        --service ${ECS_SERVICE} \
        --force-new-deployment \
        --region ${AWS_REGION}
    
    echo "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster ${ECS_CLUSTER} \
        --services ${ECS_SERVICE} \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}✓ ECS service deployed${NC}"
    echo ""
fi

# Step 4: Verify Deployment
echo -e "${YELLOW}Step 4: Verifying deployment...${NC}"

if [ -n "$ALB_DNS" ]; then
    echo "Testing health endpoint..."
    sleep 30  # Wait for service to be ready
    
    if curl -f -s "http://${ALB_DNS}/health" > /dev/null; then
        echo -e "${GREEN}✓ Health check passed${NC}"
    else
        echo -e "${RED}✗ Health check failed${NC}"
        echo "Check logs: aws logs tail /ecs/${PROJECT_NAME}-${ENVIRONMENT} --follow"
    fi
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: ${ENVIRONMENT}"
echo "Region: ${AWS_REGION}"
echo "Account: ${AWS_ACCOUNT_ID}"
echo ""

if [ -n "$ECR_URL" ]; then
    echo "ECR Repository: ${ECR_URL}"
fi

if [ -n "$ECS_CLUSTER" ]; then
    echo "ECS Cluster: ${ECS_CLUSTER}"
    echo "ECS Service: ${ECS_SERVICE}"
fi

if [ -n "$ALB_DNS" ]; then
    echo "Application URL: http://${ALB_DNS}"
fi

echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Configure SSL/TLS: ./scripts/configure-ssl.sh"
echo "2. Set up monitoring: ./scripts/setup-monitoring.sh"
echo "3. Configure domain: Point your domain to ${ALB_DNS}"
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
