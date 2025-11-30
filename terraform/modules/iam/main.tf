# IAM Module - User and Policies

# IAM user for application
resource "aws_iam_user" "app" {
  name = "${var.project_name}-${var.environment}-app"
  
  tags = {
    Name = "${var.project_name}-${var.environment}-app"
  }
}

# S3 access policy
resource "aws_iam_policy" "s3_access" {
  name        = "${var.project_name}-${var.environment}-s3-policy"
  description = "S3 access policy for ${var.project_name} application"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${var.s3_bucket_arn}/*",
          var.s3_bucket_arn
        ]
      }
    ]
  })
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "s3_access" {
  user       = aws_iam_user.app.name
  policy_arn = aws_iam_policy.s3_access.arn
}

# Create access keys
resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

# Outputs
output "user_name" {
  value = aws_iam_user.app.name
}

output "access_key_id" {
  value     = aws_iam_access_key.app.id
  sensitive = true
}

output "secret_access_key" {
  value     = aws_iam_access_key.app.secret
  sensitive = true
}
