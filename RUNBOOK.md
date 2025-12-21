# Emtelaak Platform - Operations Runbook

Quick reference guide for common operational tasks and incident response.

---

## 🚨 Emergency Procedures

### Service Down

```bash
# 1. Check health endpoint
curl http://<LOAD_BALANCER_DNS>/health

# 2. Check ECS service status
aws ecs describe-services \
  --cluster emtelaak-prod-cluster \
  --services emtelaak-prod-service

# 3. Check recent logs
aws logs tail /ecs/emtelaak-prod --since 10m

# 4. Force new deployment (if needed)
aws ecs update-service \
  --cluster emtelaak-prod-cluster \
  --service emtelaak-prod-service \
  --force-new-deployment
```

### Database Connection Issues

```bash
# 1. Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier emtelaak-prod-db

# 2. Test connectivity from ECS task
aws ecs execute-command \
  --cluster emtelaak-prod-cluster \
  --task <TASK_ARN> \
  --container app \
  --interactive \
  --command "nc -zv <DB_ENDPOINT> 3306"

# 3. Check security groups
aws ec2 describe-security-groups --group-ids <SG_ID>
```

### High Memory/CPU Usage

```bash
# 1. Check current metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=emtelaak-prod-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# 2. Scale up manually (if auto-scaling not fast enough)
aws ecs update-service \
  --cluster emtelaak-prod-cluster \
  --service emtelaak-prod-service \
  --desired-count 4

# 3. Check for memory leaks in logs
aws logs filter-log-events \
  --log-group-name /ecs/emtelaak-prod \
  --filter-pattern "out of memory"
```

---

## 🔄 Deployment Operations

### Deploy New Version

```bash
# 1. Build and push Docker image
docker build -t <ECR_URL>/emtelaak-platform:$(git rev-parse --short HEAD) .
docker push <ECR_URL>/emtelaak-platform:$(git rev-parse --short HEAD)

# 2. Update task definition (or use GitHub Actions)
aws ecs update-service \
  --cluster emtelaak-prod-cluster \
  --service emtelaak-prod-service \
  --force-new-deployment

# 3. Monitor deployment
aws ecs wait services-stable \
  --cluster emtelaak-prod-cluster \
  --services emtelaak-prod-service
```

### Rollback to Previous Version

```bash
# 1. List task definitions
aws ecs list-task-definitions \
  --family-prefix emtelaak-prod \
  --sort DESC

# 2. Rollback
aws ecs update-service \
  --cluster emtelaak-prod-cluster \
  --service emtelaak-prod-service \
  --task-definition emtelaak-prod:<PREVIOUS_REVISION>

# 3. Verify
curl http://<LOAD_BALANCER_DNS>/health
```

---

## 🗄️ Database Operations

### Run Migrations

```bash
# Get running task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster emtelaak-prod-cluster \
  --service-name emtelaak-prod-service \
  --desired-status RUNNING \
  --query 'taskArns[0]' \
  --output text)

# Execute migration
aws ecs execute-command \
  --cluster emtelaak-prod-cluster \
  --task $TASK_ARN \
  --container app \
  --interactive \
  --command "pnpm db:push"
```

### Create Database Backup

```bash
# Automated snapshot
aws rds create-db-snapshot \
  --db-instance-identifier emtelaak-prod-db \
  --db-snapshot-identifier emtelaak-backup-$(date +%Y%m%d-%H%M%S)

# Verify snapshot
aws rds describe-db-snapshots \
  --db-snapshot-identifier emtelaak-backup-$(date +%Y%m%d-%H%M%S)
```

### Restore from Backup

```bash
# 1. List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier emtelaak-prod-db

# 2. Restore to new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier emtelaak-prod-db-restored \
  --db-snapshot-identifier emtelaak-backup-20241130

# 3. Update connection string in ECS task definition
# 4. Deploy with new DATABASE_URL
```

---

## 📊 Monitoring & Logging

### View Real-time Logs

```bash
# Stream all logs
aws logs tail /ecs/emtelaak-prod --follow

# Filter errors only
aws logs tail /ecs/emtelaak-prod --follow --filter-pattern "ERROR"

# Last 1 hour
aws logs tail /ecs/emtelaak-prod --since 1h
```

### Check Application Metrics

```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=emtelaak-prod-service \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average

# Memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=emtelaak-prod-service \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average

# Request count (ALB)
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=<ALB_NAME> \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

### Set Up CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name emtelaak-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=emtelaak-prod-service

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name emtelaak-high-memory \
  --alarm-description "Alert when memory exceeds 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=emtelaak-prod-service
```

---

## 🔐 Security Operations

### Rotate JWT Secret

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 64)

# 2. Update in AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id emtelaak/prod/jwt-secret \
  --secret-string "$NEW_SECRET"

# 3. Update ECS task definition
# 4. Deploy new version

# 5. Invalidate all existing sessions (users must re-login)
```

### Rotate Database Password

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update RDS password
aws rds modify-db-instance \
  --db-instance-identifier emtelaak-prod-db \
  --master-user-password "$NEW_PASSWORD" \
  --apply-immediately

# 3. Update DATABASE_URL in ECS task definition
# 4. Deploy new version
```

### Review Security Groups

```bash
# List all security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Project,Values=emtelaak"

# Check specific security group rules
aws ec2 describe-security-groups \
  --group-ids <SG_ID>
```

---

## 📈 Scaling Operations

### Manual Scaling

```bash
# Scale up
aws ecs update-service \
  --cluster emtelaak-prod-cluster \
  --service emtelaak-prod-service \
  --desired-count 4

# Scale down
aws ecs update-service \
  --cluster emtelaak-prod-cluster \
  --service emtelaak-prod-service \
  --desired-count 1
```

### Update Auto-scaling Policies

```bash
# Update CPU target
aws application-autoscaling put-scaling-policy \
  --policy-name emtelaak-prod-cpu-autoscaling \
  --service-namespace ecs \
  --resource-id service/emtelaak-prod-cluster/emtelaak-prod-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://cpu-scaling-policy.json

# cpu-scaling-policy.json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  }
}
```

---

## 🧹 Maintenance Tasks

### Clean Up Old Docker Images

```bash
# List images
aws ecr list-images \
  --repository-name emtelaak-platform

# Delete old images (keep last 10)
aws ecr batch-delete-image \
  --repository-name emtelaak-platform \
  --image-ids imageTag=<OLD_TAG>
```

### Clean Up Old Log Streams

```bash
# Delete log streams older than 30 days
aws logs delete-log-stream \
  --log-group-name /ecs/emtelaak-prod \
  --log-stream-name <OLD_STREAM_NAME>
```

### Database Maintenance

```bash
# Optimize tables
aws ecs execute-command \
  --cluster emtelaak-prod-cluster \
  --task <TASK_ARN> \
  --container app \
  --interactive \
  --command "mysql -h <DB_ENDPOINT> -u <USER> -p -e 'OPTIMIZE TABLE properties, investments, users;'"

# Check table sizes
aws ecs execute-command \
  --cluster emtelaak-prod-cluster \
  --task <TASK_ARN> \
  --container app \
  --interactive \
  --command "mysql -h <DB_ENDPOINT> -u <USER> -p -e 'SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.TABLES WHERE table_schema = \"emtelaak\" ORDER BY size_mb DESC;'"
```

---

## 🔍 Debugging

### Access Running Container

```bash
# Get task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster emtelaak-prod-cluster \
  --service-name emtelaak-prod-service \
  --desired-status RUNNING \
  --query 'taskArns[0]' \
  --output text)

# Execute shell
aws ecs execute-command \
  --cluster emtelaak-prod-cluster \
  --task $TASK_ARN \
  --container app \
  --interactive \
  --command "/bin/sh"
```

### Check Environment Variables

```bash
# View task definition
aws ecs describe-task-definition \
  --task-definition emtelaak-prod \
  --query 'taskDefinition.containerDefinitions[0].environment'
```

### Test Database Connection

```bash
# From ECS task
aws ecs execute-command \
  --cluster emtelaak-prod-cluster \
  --task <TASK_ARN> \
  --container app \
  --interactive \
  --command "nc -zv <DB_ENDPOINT> 3306"

# Test query
aws ecs execute-command \
  --cluster emtelaak-prod-cluster \
  --task <TASK_ARN> \
  --container app \
  --interactive \
  --command "mysql -h <DB_ENDPOINT> -u <USER> -p -e 'SELECT 1;'"
```

---

## 📞 Contacts

### On-Call Rotation
- **Primary:** [Name] - [Phone] - [Email]
- **Secondary:** [Name] - [Phone] - [Email]
- **Escalation:** [Name] - [Phone] - [Email]

### Service Providers
- **AWS Support:** [Account ID] - [Support Plan]
- **Database:** [Provider] - [Support Contact]
- **CDN:** [Provider] - [Support Contact]

---

## 📋 Checklists

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Database migrations reviewed
- [ ] Environment variables updated
- [ ] Backup created
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured
- [ ] Team notified

### Post-Deployment Checklist
- [ ] Health check passing
- [ ] Logs reviewed
- [ ] Metrics normal
- [ ] User testing completed
- [ ] Documentation updated
- [ ] Team notified

### Incident Response Checklist
- [ ] Incident logged
- [ ] Team notified
- [ ] Root cause identified
- [ ] Fix applied
- [ ] Service restored
- [ ] Post-mortem scheduled
- [ ] Documentation updated

---

**Last Updated:** November 30, 2024  
**Version:** 1.0.0
