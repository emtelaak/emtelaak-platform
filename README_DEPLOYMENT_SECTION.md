# Add this section to README.md

## 🚀 Quick Deployment to AWS

Deploy the entire platform to AWS with a single command in under 20 minutes!

### Prerequisites

- AWS Account with billing enabled
- AWS CLI installed and configured
- Terraform installed

### One-Command Deployment

```bash
git clone https://github.com/emtelaak/emtelaak-platform.git
cd emtelaak-platform
./deploy-to-aws.sh dev us-east-1
```

That's it! The script will automatically:
- ✅ Create VPC with public/private subnets
- ✅ Deploy RDS MySQL database
- ✅ Create S3 bucket for file storage
- ✅ Launch EC2 instance with application
- ✅ Configure security groups and networking
- ✅ Run database migrations
- ✅ Start the application service

**Deployment time:** 15 minutes  
**Estimated cost:** ~$150/month for development

### Verify Deployment

```bash
./verify-deployment.sh
```

### Access Your Application

After deployment, access your platform at:
```
http://<EC2_IP>:3000
```

For detailed instructions, see [QUICKSTART.md](QUICKSTART.md)

### Deployment Options

- **Development**: `./deploy-to-aws.sh dev us-east-1`
- **Production**: `./deploy-to-aws.sh prod us-east-1`

### What's Included

- Complete Terraform infrastructure-as-code
- Automated database setup and migrations
- Application deployment and configuration
- Health checks and verification scripts
- Comprehensive documentation

See [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) for advanced configuration.
