##############################################################################
# lomash-wood-backend/infra/terraform/main.tf
# Root Terraform configuration — orchestrates all modules across environments
##############################################################################

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

###############################################################################
# Provider
###############################################################################

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "lomash-wood"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "platform-team"
    }
  }
}

###############################################################################
# Local values
###############################################################################

locals {
  name_prefix = "lomash-${var.environment}"

  # CIDR blocks
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  db_subnet_cidrs      = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  # Service port map — must stay in sync with each microservice's .env.example
  service_ports = {
    api-gateway          = 3000
    auth-service         = 3001
    product-service      = 3002
    order-payment-service = 3003
    appointment-service  = 3004
    content-service      = 3005
    customer-service     = 3006
    notification-service = 3007
    analytics-service    = 3008
  }

  # Names of all microservices (used to drive ECS task / Helm iterations)
  services = keys(local.service_ports)

  # S3 bucket names
  media_bucket_name  = "${local.name_prefix}-media"
  assets_bucket_name = "${local.name_prefix}-assets"
  logs_bucket_name   = "${local.name_prefix}-logs"
  tfstate_bucket     = "${local.name_prefix}-tfstate"

  # RDS identifiers (one PostgreSQL cluster, multiple logical databases)
  db_identifier = "${local.name_prefix}-postgres"

  # ElastiCache (Redis) cluster identifier
  redis_identifier = "${local.name_prefix}-redis"

  # CloudFront comment tag
  cdn_comment = "Lomash Wood ${var.environment} CDN"
}

###############################################################################
# Data sources
###############################################################################

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" { state = "available" }

###############################################################################
# Module: VPC
###############################################################################

module "vpc" {
  source = "./modules/vpc"

  name_prefix          = local.name_prefix
  vpc_cidr             = local.vpc_cidr
  public_subnet_cidrs  = local.public_subnet_cidrs
  private_subnet_cidrs = local.private_subnet_cidrs
  db_subnet_cidrs      = local.db_subnet_cidrs
  availability_zones   = slice(data.aws_availability_zones.available.names, 0, 3)
  environment          = var.environment

  enable_nat_gateway     = var.enable_nat_gateway
  single_nat_gateway     = var.environment != "production"
  enable_vpc_flow_logs   = true
  flow_log_bucket_arn    = module.s3.logs_bucket_arn
}

###############################################################################
# Module: Security Groups (inline — kept central for cross-service visibility)
###############################################################################

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Allow HTTP/HTTPS inbound to ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-alb-sg" }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-tasks-sg"
  description = "Allow inbound from ALB only"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "From ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow inter-service communication within VPC
  ingress {
    description = "Inter-service"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [local.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-ecs-tasks-sg" }
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Allow Postgres from ECS tasks only"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-rds-sg" }
}

resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-redis-sg"
  description = "Allow Redis from ECS tasks only"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis from ECS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-redis-sg" }
}

###############################################################################
# Module: Application Load Balancer
###############################################################################

module "alb" {
  source = "./modules/alb"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_id  = aws_security_group.alb.id
  environment        = var.environment
  certificate_arn    = var.acm_certificate_arn
  logs_bucket_id     = module.s3.logs_bucket_id
  service_ports      = local.service_ports
}

###############################################################################
# Module: ECS Cluster + Services
###############################################################################

module "ecs" {
  source = "./modules/ecs"

  name_prefix           = local.name_prefix
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_task_sg_id        = aws_security_group.ecs_tasks.id
  alb_target_group_arns = module.alb.target_group_arns
  ecr_registry          = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
  image_tag             = var.image_tag
  service_ports         = local.service_ports

  # Resource sizing per environment
  task_cpu    = var.ecs_task_cpu
  task_memory = var.ecs_task_memory

  # Secrets / env injection
  secrets_arn_prefix = module.secrets.secrets_arn_prefix

  # Observability
  cloudwatch_log_group = aws_cloudwatch_log_group.ecs.name

  # Autoscaling
  min_capacity = var.ecs_min_capacity
  max_capacity = var.ecs_max_capacity
}

###############################################################################
# Module: RDS (PostgreSQL 16)
###############################################################################

module "rds" {
  source = "./modules/rds"

  name_prefix       = local.name_prefix
  environment       = var.environment
  identifier        = local.db_identifier
  db_subnet_ids     = module.vpc.db_subnet_ids
  security_group_id = aws_security_group.rds.id

  engine_version      = "16.2"
  instance_class      = var.rds_instance_class
  allocated_storage   = var.rds_allocated_storage
  multi_az            = var.environment == "production"
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"

  # One logical DB per microservice (created via init.sql seed)
  # The master user credential is stored in Secrets Manager
  master_username = "lomash_master"
  db_name         = "lomash_${var.environment}"

  backup_retention_period    = var.environment == "production" ? 30 : 7
  preferred_backup_window    = "02:00-03:00"
  preferred_maintenance_window = "sun:04:00-sun:05:00"

  performance_insights_enabled = var.environment == "production"
  monitoring_interval          = var.environment == "production" ? 60 : 0

  # Store connection string in Secrets Manager automatically
  secrets_manager_arn = module.secrets.rds_secret_arn
}

###############################################################################
# Module: ElastiCache (Redis 7)
###############################################################################

module "redis" {
  source = "./modules/redis"

  name_prefix        = local.name_prefix
  environment        = var.environment
  cluster_id         = local.redis_identifier
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_id  = aws_security_group.redis.id

  node_type               = var.redis_node_type
  num_cache_nodes         = var.environment == "production" ? 2 : 1
  engine_version          = "7.2"
  at_rest_encryption      = true
  transit_encryption      = true
  automatic_failover      = var.environment == "production"
  multi_az                = var.environment == "production"

  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window          = "03:00-04:00"
}

###############################################################################
# Module: S3 Buckets
###############################################################################

module "s3" {
  source = "./modules/s3"

  name_prefix        = local.name_prefix
  environment        = var.environment
  media_bucket_name  = local.media_bucket_name
  assets_bucket_name = local.assets_bucket_name
  logs_bucket_name   = local.logs_bucket_name
  account_id         = data.aws_caller_identity.current.account_id
  cloudfront_oac_id  = module.cloudfront.oac_id
}

###############################################################################
# Module: CloudFront CDN
###############################################################################

module "cloudfront" {
  source = "./modules/cloudfront"

  name_prefix        = local.name_prefix
  environment        = var.environment
  comment            = local.cdn_comment
  media_bucket_domain = module.s3.media_bucket_regional_domain
  assets_bucket_domain = module.s3.assets_bucket_regional_domain
  alb_dns_name       = module.alb.dns_name
  certificate_arn    = var.cloudfront_certificate_arn # must be in us-east-1
  domain_aliases     = var.domain_aliases
  logs_bucket_domain = module.s3.logs_bucket_regional_domain
  price_class        = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"
}

###############################################################################
# Module: Secrets Manager
###############################################################################

module "secrets" {
  source = "./modules/secrets"

  name_prefix = local.name_prefix
  environment = var.environment
  kms_key_arn = aws_kms_key.lomash.arn

  # Secrets created (values populated out-of-band or via CI/CD)
  secret_names = [
    "database-url",
    "redis-url",
    "jwt-secret",
    "better-auth-secret",
    "stripe-secret-key",
    "stripe-webhook-secret",
    "ses-smtp-password",
    "s3-access-key",
    "s3-secret-key",
    "twilio-auth-token",
    "firebase-service-account",
    "nextauth-secret",
  ]
}

###############################################################################
# KMS — Customer-managed key for secrets & RDS encryption
###############################################################################

resource "aws_kms_key" "lomash" {
  description             = "${local.name_prefix} CMK"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = { Name = "${local.name_prefix}-cmk" }
}

resource "aws_kms_alias" "lomash" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.lomash.key_id
}

###############################################################################
# CloudWatch Log Groups (one per service)
###############################################################################

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${local.name_prefix}"
  retention_in_days = var.environment == "production" ? 90 : 14
  kms_key_id        = aws_kms_key.lomash.arn

  tags = { Name = "${local.name_prefix}-ecs-logs" }
}

resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(local.services)

  name              = "/ecs/${local.name_prefix}/${each.key}"
  retention_in_days = var.environment == "production" ? 90 : 14
  kms_key_id        = aws_kms_key.lomash.arn

  tags = { Name = "${local.name_prefix}-${each.key}-logs" }
}

###############################################################################
# CloudWatch Alarms — key SLO/SLA signals
###############################################################################

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name_prefix}-alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = var.alarm_5xx_threshold
  alarm_description   = "ALB 5xx error rate too high"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = module.alb.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  alarm_name          = "${local.name_prefix}-alb-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "p95"
  threshold           = 3 # 3 seconds — per NFR1.1
  alarm_description   = "p95 response time exceeds SLO of 3s"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = module.alb.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilisation above 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = local.db_identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${local.name_prefix}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis CPU utilisation above 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    CacheClusterId = local.redis_identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

###############################################################################
# SNS — Alerting topic
###############################################################################

resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.lomash.arn
}

resource "aws_sns_topic_subscription" "email" {
  count     = length(var.alert_email_addresses)
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email_addresses[count.index]
}

###############################################################################
# IAM — ECS Task execution role (shared)
###############################################################################

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "${local.name_prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_execution_extra" {
  # Allow pulling secrets from Secrets Manager
  statement {
    sid       = "SecretsManagerRead"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${local.name_prefix}/*"]
  }

  # Allow KMS decrypt for encrypted secrets
  statement {
    sid       = "KMSDecrypt"
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.lomash.arn]
  }

  # Allow writing to CloudWatch Logs
  statement {
    sid = "CloudWatchLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${local.name_prefix}*:*"]
  }
}

resource "aws_iam_role_policy" "ecs_execution_extra" {
  name   = "${local.name_prefix}-ecs-execution-extra"
  role   = aws_iam_role.ecs_execution.id
  policy = data.aws_iam_policy_document.ecs_execution_extra.json
}

###############################################################################
# IAM — ECS Task role (per-service permissions)
###############################################################################

resource "aws_iam_role" "ecs_task" {
  name               = "${local.name_prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

data "aws_iam_policy_document" "ecs_task" {
  # S3 access for media uploads (content-service / product images)
  statement {
    sid     = "S3MediaAccess"
    actions = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [
      module.s3.media_bucket_arn,
      "${module.s3.media_bucket_arn}/*",
      module.s3.assets_bucket_arn,
      "${module.s3.assets_bucket_arn}/*",
    ]
  }

  # SES for email sending (notification-service)
  statement {
    sid     = "SESAccess"
    actions = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }

  # SNS for push notifications (notification-service)
  statement {
    sid     = "SNSPublish"
    actions = ["sns:Publish"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "ecs_task" {
  name   = "${local.name_prefix}-ecs-task-policy"
  role   = aws_iam_role.ecs_task.id
  policy = data.aws_iam_policy_document.ecs_task.json
}

###############################################################################
# Module: Monitoring (Prometheus / Grafana via managed Grafana or self-hosted)
###############################################################################

module "monitoring" {
  source = "./modules/monitoring"

  name_prefix       = local.name_prefix
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  sns_alert_arn     = aws_sns_topic.alerts.arn

  # Pass ARNs for dashboards
  alb_arn_suffix    = module.alb.arn_suffix
  ecs_cluster_name  = module.ecs.cluster_name
  rds_identifier    = local.db_identifier
  redis_identifier  = local.redis_identifier
}

###############################################################################
# Variables
###############################################################################

variable "aws_region" {
  type        = string
  default     = "eu-west-2"
  description = "AWS region to deploy into (London for UK-based Lomash Wood)"
}

variable "environment" {
  type        = string
  description = "Deployment environment: dev | staging | production"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be one of: dev, staging, production"
  }
}

variable "image_tag" {
  type        = string
  default     = "latest"
  description = "Docker image tag to deploy for all services"
}

variable "acm_certificate_arn" {
  type        = string
  description = "ACM certificate ARN (same region as ALB) for HTTPS — NFR2.1"
}

variable "cloudfront_certificate_arn" {
  type        = string
  description = "ACM certificate ARN in us-east-1 for CloudFront"
}

variable "domain_aliases" {
  type        = list(string)
  default     = []
  description = "Custom domain aliases for CloudFront distribution"
}

variable "enable_nat_gateway" {
  type    = bool
  default = true
}

# ECS sizing
variable "ecs_task_cpu" {
  type    = number
  default = 512
}

variable "ecs_task_memory" {
  type    = number
  default = 1024
}

variable "ecs_min_capacity" {
  type    = number
  default = 1
}

variable "ecs_max_capacity" {
  type    = number
  default = 10
}

# RDS sizing
variable "rds_instance_class" {
  type    = string
  default = "db.t4g.medium"
}

variable "rds_allocated_storage" {
  type    = number
  default = 100
}

# Redis sizing
variable "redis_node_type" {
  type    = string
  default = "cache.t4g.medium"
}

# Alerting
variable "alarm_5xx_threshold" {
  type    = number
  default = 50
  description = "Number of ALB 5xx errors per minute to trigger alarm"
}

variable "alert_email_addresses" {
  type    = list(string)
  default = []
  description = "Email addresses to subscribe to the SNS alerts topic"
}

###############################################################################
# Outputs
###############################################################################

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = module.alb.dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_primary_endpoint" {
  description = "Redis primary endpoint address"
  value       = module.redis.primary_endpoint
  sensitive   = true
}

output "media_bucket_name" {
  description = "S3 bucket name for uploaded media (product images, brochures)"
  value       = module.s3.media_bucket_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "kms_key_arn" {
  description = "ARN of the Lomash Wood Customer-Managed KMS Key"
  value       = aws_kms_key.lomash.arn
}

output "sns_alerts_arn" {
  description = "ARN of the SNS topic for infrastructure alerts"
  value       = aws_sns_topic.alerts.arn
}

output "ecr_registry" {
  description = "ECR registry URL prefix for all service images"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}
