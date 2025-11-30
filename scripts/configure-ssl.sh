#!/bin/bash

# Emtelaak Platform - SSL/TLS Configuration Script
# This script configures HTTPS with ACM certificate

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="emtelaak"
ENVIRONMENT="${ENVIRONMENT:-prod}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL/TLS Configuration${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., emtelaak.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}Error: Domain name is required${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Domain: ${DOMAIN_NAME}${NC}"
echo ""

# Step 1: Request ACM Certificate
echo -e "${YELLOW}Step 1: Requesting ACM certificate...${NC}"

CERT_ARN=$(aws acm request-certificate \
    --domain-name ${DOMAIN_NAME} \
    --subject-alternative-names "*.${DOMAIN_NAME}" \
    --validation-method DNS \
    --region ${AWS_REGION} \
    --query CertificateArn \
    --output text)

echo -e "${GREEN}✓ Certificate requested: ${CERT_ARN}${NC}"
echo ""

# Step 2: Get validation records
echo -e "${YELLOW}Step 2: Getting DNS validation records...${NC}"
echo "Waiting for validation records..."
sleep 5

aws acm describe-certificate \
    --certificate-arn ${CERT_ARN} \
    --region ${AWS_REGION} \
    --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Type,ResourceRecord.Value]' \
    --output table

echo ""
echo -e "${YELLOW}Action Required:${NC}"
echo "Add the above DNS records to your domain's DNS configuration"
echo ""
echo "Example (Route 53):"
echo "  Name: _xxxxx.${DOMAIN_NAME}"
echo "  Type: CNAME"
echo "  Value: _xxxxx.acm-validations.aws."
echo ""

read -p "Press Enter after adding DNS records to continue..."

# Wait for validation
echo ""
echo -e "${YELLOW}Waiting for certificate validation...${NC}"
echo "This may take a few minutes..."

aws acm wait certificate-validated \
    --certificate-arn ${CERT_ARN} \
    --region ${AWS_REGION}

echo -e "${GREEN}✓ Certificate validated${NC}"
echo ""

# Step 3: Get Load Balancer ARN
echo -e "${YELLOW}Step 3: Configuring HTTPS listener...${NC}"

cd terraform
ALB_ARN=$(terraform output -raw alb_arn 2>/dev/null || echo "")
TARGET_GROUP_ARN=$(terraform output -raw target_group_arn 2>/dev/null || echo "")
cd ..

if [ -z "$ALB_ARN" ]; then
    echo -e "${RED}Error: Could not find Load Balancer ARN${NC}"
    echo "Get it manually: aws elbv2 describe-load-balancers"
    read -p "Enter Load Balancer ARN: " ALB_ARN
fi

if [ -z "$TARGET_GROUP_ARN" ]; then
    echo -e "${RED}Error: Could not find Target Group ARN${NC}"
    echo "Get it manually: aws elbv2 describe-target-groups"
    read -p "Enter Target Group ARN: " TARGET_GROUP_ARN
fi

# Create HTTPS listener
echo "Creating HTTPS listener..."

HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn ${ALB_ARN} \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=${CERT_ARN} \
    --default-actions Type=forward,TargetGroupArn=${TARGET_GROUP_ARN} \
    --region ${AWS_REGION} \
    --query 'Listeners[0].ListenerArn' \
    --output text)

echo -e "${GREEN}✓ HTTPS listener created${NC}"
echo ""

# Step 4: Configure HTTP to HTTPS redirect
echo -e "${YELLOW}Step 4: Configuring HTTP to HTTPS redirect...${NC}"

# Get HTTP listener ARN
HTTP_LISTENER_ARN=$(aws elbv2 describe-listeners \
    --load-balancer-arn ${ALB_ARN} \
    --region ${AWS_REGION} \
    --query 'Listeners[?Port==`80`].ListenerArn' \
    --output text)

if [ -n "$HTTP_LISTENER_ARN" ]; then
    # Modify HTTP listener to redirect to HTTPS
    aws elbv2 modify-listener \
        --listener-arn ${HTTP_LISTENER_ARN} \
        --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}✓ HTTP to HTTPS redirect configured${NC}"
else
    echo -e "${YELLOW}Note: HTTP listener not found, skipping redirect${NC}"
fi

echo ""

# Step 5: Update security group
echo -e "${YELLOW}Step 5: Updating security group for HTTPS...${NC}"

# Get ALB security group
ALB_SG=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns ${ALB_ARN} \
    --region ${AWS_REGION} \
    --query 'LoadBalancers[0].SecurityGroups[0]' \
    --output text)

# Add HTTPS ingress rule (if not exists)
aws ec2 authorize-security-group-ingress \
    --group-id ${ALB_SG} \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region ${AWS_REGION} 2>/dev/null || echo "HTTPS rule already exists"

echo -e "${GREEN}✓ Security group updated${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL/TLS Configuration Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Domain: ${DOMAIN_NAME}"
echo "Certificate ARN: ${CERT_ARN}"
echo "HTTPS Listener: ${HTTPS_LISTENER_ARN}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Point your domain to the Load Balancer:"
echo "   $(cd terraform && terraform output -raw load_balancer_dns 2>/dev/null || echo 'Get from AWS Console')"
echo ""
echo "2. Test HTTPS:"
echo "   curl https://${DOMAIN_NAME}/health"
echo ""
echo "3. Set up monitoring:"
echo "   ./scripts/setup-monitoring.sh"
echo ""
echo -e "${GREEN}Configuration complete!${NC}"
