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

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "lomash-wood-backend"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "lomash-wood-backend"
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"

  project     = var.project
  environment = var.environment

  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = true
  enable_vpn_gateway     = false
  enable_flow_logs       = false
}

module "monitoring" {
  source = "../../modules/monitoring"

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  alert_email_endpoints          = var.alert_email_endpoints
  critical_alert_email_endpoints = var.alert_email_endpoints
  slack_webhook_lambda_arn       = null

  alb_arn_suffix             = module.alb.alb_arn_suffix
  rds_instance_identifier    = module.rds.instance_identifier
  redis_replication_group_id = module.redis.replication_group_id
  ecs_cluster_name           = module.ecs.cluster_name
  cloudfront_distribution_id = module.cloudfront.distribution_id

  ecs_service_names = var.ecs_service_names
  log_retention_days = 7

  rds_cpu_alarm_threshold         = 90
  rds_free_storage_alarm_bytes    = 2147483648
  rds_connections_alarm_threshold = 50
  rds_latency_alarm_threshold     = 0.05

  ecs_cpu_alarm_threshold    = 90
  ecs_memory_alarm_threshold = 90

  app_error_count_alarm_threshold     = 50
  appointment_failure_alarm_threshold = 20
  auth_failure_alarm_threshold        = 200

  enable_budget_alarm      = false
  monthly_budget_limit_usd = "100"
}

module "s3_media" {
  source = "../../modules/s3"

  project        = var.project
  environment    = var.environment
  bucket_suffix  = "media"
  bucket_purpose = "Product images, media wall assets, blog images"

  versioning_enabled    = false
  allow_public_read     = false
  create_cloudfront_oai = false

  cors_allowed_origins = ["*"]
  cors_allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]

  lifecycle_rules = [
    {
      id      = "abort-multipart"
      enabled = true
      abort_incomplete_multipart_upload_days = 3
    }
  ]
}

module "s3_uploads" {
  source = "../../modules/s3"

  project        = var.project
  environment    = var.environment
  bucket_suffix  = "uploads"
  bucket_purpose = "Temporary user upload staging"

  versioning_enabled = false
  allow_public_read  = false

  cors_allowed_origins = ["*"]
  cors_allowed_methods = ["PUT", "POST", "GET", "HEAD"]

  lifecycle_rules = [
    {
      id              = "expire-temp-uploads"
      enabled         = true
      prefix          = "temp/"
      expiration_days = 1
      abort_incomplete_multipart_upload_days = 1
    }
  ]
}

module "s3_logs" {
  source = "../../modules/s3"

  project        = var.project
  environment    = var.environment
  bucket_suffix  = "logs"
  bucket_purpose = "ALB and CloudFront access logs"

  versioning_enabled = false
  allow_public_read  = false

  lifecycle_rules = [
    {
      id              = "expire-logs"
      enabled         = true
      expiration_days = 14
      abort_incomplete_multipart_upload_days = 1
    }
  ]
}

module "secrets" {
  source = "../../modules/secrets"

  project     = var.project
  environment = var.environment

  create_kms_key    = false
  deny_non_tls      = true

  secrets = [
    {
      name        = "database/primary"
      description = "PostgreSQL primary database credentials"
      group       = "database"
      initial_value = jsonencode({
        host     = module.rds.primary_endpoint
        port     = 5432
        dbname   = var.db_name
        username = var.db_username
        password = var.db_password
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "redis/auth-token"
      description = "Redis AUTH token and connection details"
      group       = "cache"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "auth/jwt-secret"
      description = "JWT signing secret for Better Auth"
      group       = "auth"
      initial_value = var.jwt_secret
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "auth/better-auth-secret"
      description = "Better Auth secret key"
      group       = "auth"
      initial_value = var.better_auth_secret
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "stripe/secret-key"
      description = "Stripe secret API key"
      group       = "payments"
      initial_value = var.stripe_secret_key
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "stripe/webhook-secret"
      description = "Stripe webhook endpoint signing secret"
      group       = "payments"
      initial_value = var.stripe_webhook_secret
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "email/smtp-credentials"
      description = "SMTP credentials for Nodemailer"
      group       = "notifications"
      initial_value = jsonencode({
        host     = var.smtp_host
        port     = var.smtp_port
        username = var.smtp_username
        password = var.smtp_password
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    }
  ]

  enable_access_failure_alarm = false
  sns_alarm_topic_arns        = [module.monitoring.alerts_topic_arn]
}

module "rds" {
  source = "../../modules/rds"

  project     = var.project
  environment = var.environment

  vpc_id               = module.vpc.vpc_id
  database_subnet_ids  = module.vpc.database_subnet_ids
  allowed_security_group_ids = [module.ecs.service_security_group_id]

  engine_version          = "16.2"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  max_allocated_storage   = 50
  multi_az                = false
  deletion_protection     = false
  skip_final_snapshot     = true
  backup_retention_period = 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:05:00-sun:06:00"

  db_name   = var.db_name
  db_username = var.db_username
  db_password = var.db_password

  performance_insights_enabled = false
  monitoring_interval          = 0

  sns_alarm_topic_arns = [module.monitoring.alerts_topic_arn]
}

module "redis" {
  source = "../../modules/redis"

  project     = var.project
  environment = var.environment

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.ecs.service_security_group_id]

  node_type          = "cache.t3.micro"
  num_cache_clusters = 1
  engine_version     = "7.0"
  auth_token         = var.redis_auth_token

  snapshot_retention_limit = 0
  log_retention_days       = 7

  sns_alarm_topic_arns = [module.monitoring.alerts_topic_arn]
}

module "alb" {
  source = "../../modules/alb"

  project     = var.project
  environment = var.environment

  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  acm_certificate_arn    = var.acm_certificate_arn
  extra_certificate_arns = []
  ssl_policy             = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  access_log_bucket_id = module.s3_logs.bucket_id
  waf_web_acl_arn      = null

  idle_timeout = 60

  target_groups = [
    { name = "api-gateway",           port = 3000, target_type = "ip", health_check_path = "/health" },
    { name = "auth-service",          port = 3001, target_type = "ip", health_check_path = "/health" },
    { name = "product-service",       port = 3002, target_type = "ip", health_check_path = "/health" },
    { name = "order-payment-service", port = 3003, target_type = "ip", health_check_path = "/health" },
    { name = "appointment-service",   port = 3004, target_type = "ip", health_check_path = "/health" },
    { name = "content-service",       port = 3005, target_type = "ip", health_check_path = "/health" },
    { name = "customer-service",      port = 3006, target_type = "ip", health_check_path = "/health" },
    { name = "notification-service",  port = 3007, target_type = "ip", health_check_path = "/health" },
    { name = "analytics-service",     port = 3008, target_type = "ip", health_check_path = "/health" }
  ]

  listener_rules = [
    { priority = 10, target_group_name = "auth-service",          path_patterns = ["/v1/auth/*"] },
    { priority = 20, target_group_name = "product-service",       path_patterns = ["/v1/products/*", "/v1/categories/*", "/v1/colours/*", "/v1/sizes/*"] },
    { priority = 30, target_group_name = "order-payment-service", path_patterns = ["/v1/orders/*", "/v1/payments/*", "/v1/webhooks/*", "/v1/invoices/*"] },
    { priority = 40, target_group_name = "appointment-service",   path_patterns = ["/v1/appointments/*", "/v1/showrooms/*", "/v1/availability/*"] },
    { priority = 50, target_group_name = "content-service",       path_patterns = ["/v1/blog/*", "/v1/media/*", "/v1/brochures/*", "/v1/pages/*"] },
    { priority = 60, target_group_name = "customer-service",      path_patterns = ["/v1/customers/*", "/v1/reviews/*", "/v1/wishlist/*"] },
    { priority = 70, target_group_name = "notification-service",  path_patterns = ["/v1/notifications/*", "/v1/newsletter/*"] },
    { priority = 80, target_group_name = "analytics-service",     path_patterns = ["/v1/analytics/*"] },
    { priority = 90, target_group_name = "api-gateway",           path_patterns = ["/v1/*"] }
  ]

  alarm_5xx_threshold             = 20
  alarm_4xx_threshold             = 200
  alarm_latency_threshold_seconds = 5
  sns_alarm_topic_arns            = [module.monitoring.alerts_topic_arn]
}

module "cloudfront" {
  source = "../../modules/cloudfront"

  project     = var.project
  environment = var.environment

  domain_aliases      = var.cloudfront_domain_aliases
  acm_certificate_arn = var.cloudfront_acm_certificate_arn

  s3_bucket_regional_domain_name = module.s3_media.bucket_regional_domain_name
  alb_dns_name                   = module.alb.alb_dns_name
  cloudfront_origin_secret       = var.cloudfront_origin_secret

  price_class              = "PriceClass_100"
  origin_shield_enabled    = false
  origin_shield_region     = var.aws_region
  origin_read_timeout      = 30
  origin_keepalive_timeout = 5

  static_assets_default_ttl = 3600
  static_assets_max_ttl     = 86400

  content_security_policy = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"

  waf_web_acl_arn        = null
  log_bucket_domain_name = module.s3_logs.bucket_domain_name

  custom_error_responses = [
    { error_code = 403, response_code = 200, response_page_path = "/index.html", error_caching_min_ttl = 10 },
    { error_code = 404, response_code = 200, response_page_path = "/index.html", error_caching_min_ttl = 10 }
  ]

  alarm_5xx_rate_threshold         = 10
  alarm_4xx_rate_threshold         = 20
  alarm_total_error_rate_threshold = 20
  alarm_origin_latency_ms          = 5000
  sns_alarm_topic_arns             = [module.monitoring.alerts_topic_arn]
}

module "ecs" {
  source = "../../modules/ecs"

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  target_group_arns        = module.alb.target_group_arns
  alb_security_group_id    = module.alb.security_group_id
  log_group_names          = module.monitoring.application_log_group_names
  secrets_read_policy_arn  = module.secrets.read_secrets_policy_arn

  container_image_tag = var.container_image_tag
  ecr_repository_url  = var.ecr_repository_url

  services = {
    api-gateway = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3000
      environment = {
        NODE_ENV    = "development"
        PORT        = "3000"
        LOG_LEVEL   = "debug"
      }
      secrets = {
        JWT_SECRET        = "${module.secrets.secret_arns["auth/jwt-secret"]}:jwt_secret::"
        BETTER_AUTH_SECRET = "${module.secrets.secret_arns["auth/better-auth-secret"]}:better_auth_secret::"
      }
    }
    auth-service = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3001
      environment = {
        NODE_ENV  = "development"
        PORT      = "3001"
        LOG_LEVEL = "debug"
        REDIS_URL = "rediss://:@${module.redis.primary_endpoint_address}:6379"
      }
      secrets = {
        DATABASE_URL      = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        JWT_SECRET        = "${module.secrets.secret_arns["auth/jwt-secret"]}:jwt_secret::"
        BETTER_AUTH_SECRET = "${module.secrets.secret_arns["auth/better-auth-secret"]}:better_auth_secret::"
      }
    }
    product-service = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3002
      environment = {
        NODE_ENV  = "development"
        PORT      = "3002"
        LOG_LEVEL = "debug"
      }
      secrets = {
        DATABASE_URL = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
      }
    }
    order-payment-service = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3003
      environment = {
        NODE_ENV  = "development"
        PORT      = "3003"
        LOG_LEVEL = "debug"
      }
      secrets = {
        DATABASE_URL          = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        STRIPE_SECRET_KEY     = "${module.secrets.secret_arns["stripe/secret-key"]}::"
        STRIPE_WEBHOOK_SECRET = "${module.secrets.secret_arns["stripe/webhook-secret"]}::"
      }
    }
    appointment-service = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3004
      environment = {
        NODE_ENV  = "development"
        PORT      = "3004"
        LOG_LEVEL = "debug"
      }
      secrets = {
        DATABASE_URL = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        SMTP_HOST    = "${module.secrets.secret_arns["email/smtp-credentials"]}:host::"
        SMTP_USER    = "${module.secrets.secret_arns["email/smtp-credentials"]}:username::"
        SMTP_PASS    = "${module.secrets.secret_arns["email/smtp-credentials"]}:password::"
      }
    }
    content-service = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3005
      environment = {
        NODE_ENV        = "development"
        PORT            = "3005"
        LOG_LEVEL       = "debug"
        S3_BUCKET_NAME  = module.s3_media.bucket_id
        S3_REGION       = var.aws_region
      }
      secrets = {
        DATABASE_URL = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
      }
    }
    customer-service = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3006
      environment = {
        NODE_ENV  = "development"
        PORT      = "3006"
        LOG_LEVEL = "debug"
      }
      secrets = {
        DATABASE_URL = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
      }
    }
    notification-service = {
      cpu           = 256
      memory        = 512
      desired_count = 1
      port          = 3007
      environment = {
        NODE_ENV  = "development"
        PORT      = "3007"
        LOG_LEVEL = "debug"
      }
      secrets = {
        DATABASE_URL  = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        SMTP_HOST     = "${module.secrets.secret_arns["email/smtp-credentials"]}:host::"
        SMTP_USER     = "${module.secrets.secret_arns["email/smtp-credentials"]}:username::"
        SMTP_PASS     = "${module.secrets.secret_arns["email/smtp-credentials"]}:password::"
      }
    }
    analytics-service = {
      cpu           = 256
      memory        = 256
      desired_count = 1
      port          = 3008
      environment = {
        NODE_ENV  = "development"
        PORT      = "3008"
        LOG_LEVEL = "debug"
      }
      secrets = {
        DATABASE_URL = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
      }
    }
  }
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "lomash-wood"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
}

variable "database_subnet_cidrs" {
  description = "Database subnet CIDR blocks"
  type        = list(string)
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Redis AUTH token"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "better_auth_secret" {
  description = "Better Auth secret key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret API key (test mode for dev)"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
}

variable "smtp_port" {
  description = "SMTP port"
  type        = number
  default     = 587
}

variable "smtp_username" {
  description = "SMTP username"
  type        = string
}

variable "smtp_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for the ALB HTTPS listener"
  type        = string
}

variable "cloudfront_acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for CloudFront"
  type        = string
  default     = null
}

variable "cloudfront_domain_aliases" {
  description = "Custom domain aliases for CloudFront"
  type        = list(string)
  default     = []
}

variable "cloudfront_origin_secret" {
  description = "Secret header value for CloudFront → ALB verification"
  type        = string
  sensitive   = true
  default     = "dev-cloudfront-secret"
}

variable "alert_email_endpoints" {
  description = "Email addresses for CloudWatch alarm notifications"
  type        = list(string)
  default     = []
}

variable "ecs_service_names" {
  description = "List of ECS service names"
  type        = list(string)
  default = [
    "api-gateway",
    "auth-service",
    "product-service",
    "order-payment-service",
    "appointment-service",
    "content-service",
    "customer-service",
    "notification-service",
    "analytics-service"
  ]
}

variable "container_image_tag" {
  description = "Docker image tag to deploy across all services"
  type        = string
  default     = "latest"
}

variable "ecr_repository_url" {
  description = "Base ECR repository URL"
  type        = string
}
