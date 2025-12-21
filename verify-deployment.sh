#!/bin/bash

# Emtelaak Platform - Deployment Verification Script
# Checks if all services are running correctly

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get EC2 IP from Terraform output
cd terraform
EC2_IP=$(terraform output -raw ec2_public_ip 2>/dev/null || echo "")
cd ..

if [ -z "$EC2_IP" ]; then
    echo -e "${RED}✗ Could not get EC2 IP from Terraform${NC}"
    echo "Run this script from the project root after deployment"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}║           Emtelaak Platform - Deployment Verification      ║${NC}"
echo -e "${BLUE}║                                                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}EC2 Instance:${NC} ${EC2_IP}"
echo ""

PASSED=0
FAILED=0

# Check 1: EC2 Instance Reachable
echo -e "${BLUE}[1/7] Checking EC2 instance connectivity...${NC}"
if ping -c 1 -W 2 ${EC2_IP} &> /dev/null; then
    echo -e "${GREEN}✓ EC2 instance is reachable${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ EC2 instance is not reachable${NC}"
    ((FAILED++))
fi
echo ""

# Check 2: Application Port
echo -e "${BLUE}[2/7] Checking application port (3000)...${NC}"
if nc -z -w5 ${EC2_IP} 3000 2>/dev/null; then
    echo -e "${GREEN}✓ Port 3000 is open${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Port 3000 is not accessible${NC}"
    ((FAILED++))
fi
echo ""

# Check 3: HTTP Response
echo -e "${BLUE}[3/7] Checking HTTP response...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${EC2_IP}:3000" || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓ Application is responding (HTTP ${HTTP_CODE})${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Application is not responding (HTTP ${HTTP_CODE})${NC}"
    ((FAILED++))
fi
echo ""

# Check 4: Database Connection
echo -e "${BLUE}[4/7] Checking database connectivity...${NC}"
cd terraform
DB_ENDPOINT=$(terraform output -raw database_endpoint 2>/dev/null || echo "")
cd ..

if [ -n "$DB_ENDPOINT" ]; then
    DB_HOST=$(echo $DB_ENDPOINT | cut -d: -f1)
    if nc -z -w5 ${DB_HOST} 3306 2>/dev/null; then
        echo -e "${GREEN}✓ Database is reachable${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Database is not reachable${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Could not get database endpoint${NC}"
fi
echo ""

# Check 5: S3 Bucket
echo -e "${BLUE}[5/7] Checking S3 bucket...${NC}"
cd terraform
S3_BUCKET=$(terraform output -raw s3_bucket 2>/dev/null || echo "")
cd ..

if [ -n "$S3_BUCKET" ]; then
    if aws s3 ls "s3://${S3_BUCKET}" &> /dev/null; then
        echo -e "${GREEN}✓ S3 bucket is accessible${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ S3 bucket is not accessible${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Could not get S3 bucket name${NC}"
fi
echo ""

# Check 6: Application Service
echo -e "${BLUE}[6/7] Checking application service status...${NC}"
KEY_NAME=$(cd terraform && terraform output -json | jq -r '.ssh_command.value' | grep -oP '(?<=-i )[^ ]+' || echo "")

if [ -n "$KEY_NAME" ]; then
    SERVICE_STATUS=$(ssh -i "$KEY_NAME" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "sudo systemctl is-active emtelaak" 2>/dev/null || echo "unknown")
    
    if [ "$SERVICE_STATUS" = "active" ]; then
        echo -e "${GREEN}✓ Application service is running${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ Application service is not running (status: ${SERVICE_STATUS})${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ Could not verify service status (SSH key not found)${NC}"
fi
echo ""

# Check 7: SSL Certificate (if configured)
echo -e "${BLUE}[7/7] Checking SSL certificate...${NC}"
if curl -s -k "https://${EC2_IP}" &> /dev/null; then
    echo -e "${GREEN}✓ SSL is configured${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SSL not configured (optional for development)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Passed:${NC} ${PASSED}"
echo -e "${RED}Failed:${NC} ${FAILED}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Deployment is healthy.${NC}"
    echo ""
    echo -e "${BLUE}Access your application:${NC}"
    echo -e "  ${GREEN}URL:${NC} http://${EC2_IP}:3000"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo -e "  1. Check application logs:"
    echo -e "     ${BLUE}ssh -i ${KEY_NAME} ubuntu@${EC2_IP} 'sudo journalctl -u emtelaak -n 50'${NC}"
    echo -e "  2. Check deployment log:"
    echo -e "     ${BLUE}ssh -i ${KEY_NAME} ubuntu@${EC2_IP} 'cat /home/ubuntu/deployment-log.txt'${NC}"
    echo -e "  3. Verify environment variables:"
    echo -e "     ${BLUE}ssh -i ${KEY_NAME} ubuntu@${EC2_IP} 'cat /home/ubuntu/emtelaak-platform/.env'${NC}"
    echo ""
    exit 1
fi
