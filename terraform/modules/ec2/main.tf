# EC2 Module - Application Server

# Security group for EC2
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-${var.environment}-ec2-sg"
  description = "Security group for EC2 application server"
  vpc_id      = var.vpc_id
  
  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Application port
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-ec2-sg"
  }
}

# Get latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# User data script to set up application
locals {
  user_data = <<-EOF
    #!/bin/bash
    set -e
    
    # Update system
    apt-get update
    apt-get upgrade -y
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker ubuntu
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Install Node.js and pnpm
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    npm install -g pnpm@9
    
    # Clone repository
    cd /home/ubuntu
    git clone https://github.com/emtelaak/emtelaak-platform.git
    cd emtelaak-platform
    chown -R ubuntu:ubuntu /home/ubuntu/emtelaak-platform
    
    # Create .env file
    cat > .env <<ENVEOF
    DATABASE_URL=${var.database_url}
    JWT_SECRET=${var.jwt_secret}
    
    S3_ENDPOINT=https://s3.${var.s3_region}.amazonaws.com
    S3_REGION=${var.s3_region}
    S3_BUCKET=${var.s3_bucket}
    S3_ACCESS_KEY_ID=${var.s3_access_key_id}
    S3_SECRET_ACCESS_KEY=${var.s3_secret_key}
    
    NODE_ENV=production
    PORT=3000
    VITE_APP_TITLE=Emtelaak Platform
    VITE_APP_LOGO=/logo.png
    
    SMTP_HOST=smtp.sendgrid.net
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=apikey
    SMTP_PASSWORD=REPLACE_WITH_SENDGRID_KEY
    SMTP_FROM_EMAIL=noreply@emtelaak.com
    SMTP_FROM_NAME=Emtelaak Platform
    ENVEOF
    
    chown ubuntu:ubuntu .env
    
    # Install dependencies and build
    su - ubuntu -c "cd /home/ubuntu/emtelaak-platform && pnpm install --frozen-lockfile"
    su - ubuntu -c "cd /home/ubuntu/emtelaak-platform && pnpm build"
    
    # Run database migrations
    su - ubuntu -c "cd /home/ubuntu/emtelaak-platform && pnpm db:push"
    
    # Create systemd service
    cat > /etc/systemd/system/emtelaak.service <<SERVICEEOF
    [Unit]
    Description=Emtelaak Platform
    After=network.target
    
    [Service]
    Type=simple
    User=ubuntu
    WorkingDirectory=/home/ubuntu/emtelaak-platform
    Environment=NODE_ENV=production
    ExecStart=/usr/bin/node server/_core/index.js
    Restart=always
    RestartSec=10
    
    [Install]
    WantedBy=multi-user.target
    SERVICEEOF
    
    # Start service
    systemctl daemon-reload
    systemctl enable emtelaak
    systemctl start emtelaak
    
    # Create deployment complete marker
    touch /home/ubuntu/deployment-complete
    echo "Deployment completed at $(date)" > /home/ubuntu/deployment-log.txt
  EOF
}

# EC2 instance
resource "aws_instance" "app" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name
  
  subnet_id                   = var.public_subnet_ids[0]
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  associate_public_ip_address = true
  
  user_data = local.user_data
  
  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }
  
  tags = {
    Name = "${var.project_name}-${var.environment}-app"
  }
}

# Outputs
output "instance_id" {
  value = aws_instance.app.id
}

output "public_ip" {
  value = aws_instance.app.public_ip
}

output "private_ip" {
  value = aws_instance.app.private_ip
}

output "security_group_id" {
  value = aws_security_group.ec2.id
}
