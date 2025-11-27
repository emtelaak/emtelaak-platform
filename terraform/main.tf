# Emtelaak Platform - Main Terraform Configuration
# Complete AWS infrastructure deployment

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  # Uncomment for remote state (recommended for production)
  # backend "s3" {
  #   bucket         = "emtelaak-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "emtelaak-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}

# S3 Module
module "s3" {
  source = "./modules/s3"
  
  project_name = var.project_name
  environment  = var.environment
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  project_name = var.project_name
  environment  = var.environment
  s3_bucket_arn = module.s3.bucket_arn
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  project_name        = var.project_name
  environment         = var.environment
  db_instance_class   = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = random_password.db_password.result
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  multi_az            = var.db_multi_az
}

# EC2 Module (Application Server)
module "ec2" {
  source = "./modules/ec2"
  
  project_name       = var.project_name
  environment        = var.environment
  instance_type      = var.ec2_instance_type
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  key_name           = var.ec2_key_name
  
  # Environment variables for application
  database_url       = "mysql://${var.db_username}:${random_password.db_password.result}@${module.rds.db_endpoint}/${var.db_name}"
  jwt_secret         = random_password.jwt_secret.result
  s3_bucket          = module.s3.bucket_name
  s3_region          = var.aws_region
  s3_access_key_id   = module.iam.access_key_id
  s3_secret_key      = module.iam.secret_access_key
}

# Outputs
output "application_url" {
  description = "URL to access the application"
  value       = "http://${module.ec2.public_ip}:3000"
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "database_password" {
  description = "RDS database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "jwt_secret" {
  description = "JWT secret for authentication"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

output "s3_bucket" {
  description = "S3 bucket name for file storage"
  value       = module.s3.bucket_name
}

output "s3_access_key_id" {
  description = "S3 access key ID"
  value       = module.iam.access_key_id
  sensitive   = true
}

output "s3_secret_access_key" {
  description = "S3 secret access key"
  value       = module.iam.secret_access_key
  sensitive   = true
}

output "ec2_public_ip" {
  description = "EC2 instance public IP"
  value       = module.ec2.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to EC2 instance"
  value       = "ssh -i ${var.ec2_key_name}.pem ubuntu@${module.ec2.public_ip}"
}
