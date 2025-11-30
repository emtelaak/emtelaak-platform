#!/bin/bash

# Emtelaak Platform - CloudWatch Monitoring Setup
# This script configures CloudWatch alarms and dashboards

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
echo -e "${GREEN}CloudWatch Monitoring Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check prerequisites
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Get ECS details
cd terraform
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null || echo "")
ECS_SERVICE=$(terraform output -raw ecs_service_name 2>/dev/null || echo "")
ALB_NAME=$(terraform output -raw alb_name 2>/dev/null || echo "")
cd ..

if [ -z "$ECS_CLUSTER" ]; then
    read -p "Enter ECS Cluster name: " ECS_CLUSTER
fi

if [ -z "$ECS_SERVICE" ]; then
    read -p "Enter ECS Service name: " ECS_SERVICE
fi

# Get notification email
read -p "Enter email for alarm notifications: " ALARM_EMAIL

if [ -z "$ALARM_EMAIL" ]; then
    echo -e "${YELLOW}Warning: No email provided, alarms will be created without notifications${NC}"
fi

echo ""

# Step 1: Create SNS Topic
if [ -n "$ALARM_EMAIL" ]; then
    echo -e "${YELLOW}Step 1: Creating SNS topic for notifications...${NC}"
    
    SNS_TOPIC_ARN=$(aws sns create-topic \
        --name ${PROJECT_NAME}-${ENVIRONMENT}-alarms \
        --region ${AWS_REGION} \
        --query 'TopicArn' \
        --output text)
    
    echo -e "${GREEN}✓ SNS topic created: ${SNS_TOPIC_ARN}${NC}"
    
    # Subscribe email
    aws sns subscribe \
        --topic-arn ${SNS_TOPIC_ARN} \
        --protocol email \
        --notification-endpoint ${ALARM_EMAIL} \
        --region ${AWS_REGION}
    
    echo -e "${YELLOW}Check your email and confirm the subscription${NC}"
    echo ""
fi

# Step 2: Create CloudWatch Alarms
echo -e "${YELLOW}Step 2: Creating CloudWatch alarms...${NC}"

# High CPU Alarm
echo "Creating high CPU alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-high-cpu" \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=${ECS_SERVICE} Name=ClusterName,Value=${ECS_CLUSTER} \
    ${SNS_TOPIC_ARN:+--alarm-actions ${SNS_TOPIC_ARN}} \
    --region ${AWS_REGION}

echo -e "${GREEN}✓ High CPU alarm created${NC}"

# High Memory Alarm
echo "Creating high memory alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-high-memory" \
    --alarm-description "Alert when memory exceeds 85%" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 85 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=${ECS_SERVICE} Name=ClusterName,Value=${ECS_CLUSTER} \
    ${SNS_TOPIC_ARN:+--alarm-actions ${SNS_TOPIC_ARN}} \
    --region ${AWS_REGION}

echo -e "${GREEN}✓ High memory alarm created${NC}"

# Unhealthy Target Alarm
if [ -n "$ALB_NAME" ]; then
    echo "Creating unhealthy target alarm..."
    
    # Get target group ARN
    TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
        --names ${PROJECT_NAME}-${ENVIRONMENT}-tg \
        --region ${AWS_REGION} \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$TARGET_GROUP_ARN" ]; then
        # Extract target group name from ARN
        TG_FULL_NAME=$(echo ${TARGET_GROUP_ARN} | awk -F':' '{print $6}' | sed 's/targetgroup\///')
        
        aws cloudwatch put-metric-alarm \
            --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-unhealthy-targets" \
            --alarm-description "Alert when targets are unhealthy" \
            --metric-name UnHealthyHostCount \
            --namespace AWS/ApplicationELB \
            --statistic Average \
            --period 60 \
            --evaluation-periods 2 \
            --threshold 1 \
            --comparison-operator GreaterThanOrEqualToThreshold \
            --dimensions Name=TargetGroup,Value=${TG_FULL_NAME} Name=LoadBalancer,Value=${ALB_NAME} \
            ${SNS_TOPIC_ARN:+--alarm-actions ${SNS_TOPIC_ARN}} \
            --region ${AWS_REGION}
        
        echo -e "${GREEN}✓ Unhealthy target alarm created${NC}"
    fi
fi

# Low Healthy Target Count
if [ -n "$ALB_NAME" ] && [ -n "$TARGET_GROUP_ARN" ]; then
    echo "Creating low healthy target alarm..."
    
    TG_FULL_NAME=$(echo ${TARGET_GROUP_ARN} | awk -F':' '{print $6}' | sed 's/targetgroup\///')
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${ENVIRONMENT}-low-healthy-targets" \
        --alarm-description "Alert when healthy target count is low" \
        --metric-name HealthyHostCount \
        --namespace AWS/ApplicationELB \
        --statistic Average \
        --period 60 \
        --evaluation-periods 2 \
        --threshold 1 \
        --comparison-operator LessThanThreshold \
        ${SNS_TOPIC_ARN:+--alarm-actions ${SNS_TOPIC_ARN}} \
        --region ${AWS_REGION}
    
    echo -e "${GREEN}✓ Low healthy target alarm created${NC}"
fi

echo ""

# Step 3: Create CloudWatch Dashboard
echo -e "${YELLOW}Step 3: Creating CloudWatch dashboard...${NC}"

# Create dashboard JSON
cat > /tmp/dashboard.json <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "CPUUtilization", { "stat": "Average", "label": "CPU Utilization" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "ECS CPU Utilization",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                }
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ECS", "MemoryUtilization", { "stat": "Average", "label": "Memory Utilization" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "ECS Memory Utilization",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                }
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "RequestCount", { "stat": "Sum", "label": "Request Count" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "ALB Request Count",
                "period": 300
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/ApplicationELB", "TargetResponseTime", { "stat": "Average", "label": "Response Time" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${AWS_REGION}",
                "title": "ALB Response Time",
                "period": 300
            }
        }
    ]
}
EOF

aws cloudwatch put-dashboard \
    --dashboard-name ${PROJECT_NAME}-${ENVIRONMENT} \
    --dashboard-body file:///tmp/dashboard.json \
    --region ${AWS_REGION}

echo -e "${GREEN}✓ CloudWatch dashboard created${NC}"
echo ""

# Step 4: Enable Container Insights (if not already enabled)
echo -e "${YELLOW}Step 4: Enabling Container Insights...${NC}"

aws ecs update-cluster-settings \
    --cluster ${ECS_CLUSTER} \
    --settings name=containerInsights,value=enabled \
    --region ${AWS_REGION} 2>/dev/null || echo "Container Insights already enabled"

echo -e "${GREEN}✓ Container Insights enabled${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Monitoring Setup Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "ECS Cluster: ${ECS_CLUSTER}"
echo "ECS Service: ${ECS_SERVICE}"

if [ -n "$SNS_TOPIC_ARN" ]; then
    echo "SNS Topic: ${SNS_TOPIC_ARN}"
    echo "Notification Email: ${ALARM_EMAIL}"
fi

echo ""
echo -e "${GREEN}Alarms Created:${NC}"
echo "  • High CPU (>80%)"
echo "  • High Memory (>85%)"
echo "  • Unhealthy Targets"
echo "  • Low Healthy Target Count"
echo ""
echo -e "${GREEN}Dashboard:${NC}"
echo "  https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PROJECT_NAME}-${ENVIRONMENT}"
echo ""
echo -e "${GREEN}Logs:${NC}"
echo "  aws logs tail /ecs/${PROJECT_NAME}-${ENVIRONMENT} --follow"
echo ""
echo -e "${GREEN}Monitoring setup complete!${NC}"
