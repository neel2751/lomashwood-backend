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

  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs

  enable_nat_gateway      = true
  single_nat_gateway      = false
  enable_vpn_gateway      = false
  enable_flow_logs        = true
  flow_log_retention_days = 90
}

module "kms" {
  source = "../../modules/kms"

  project     = var.project
  environment = var.environment

  key_administrators      = var.kms_key_administrator_arns
  key_users               = []
  enable_key_rotation     = true
  deletion_window_in_days = 30
}

module "monitoring" {
  source = "../../modules/monitoring"

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region
  kms_key_arn = module.kms.key_arn

  alert_email_endpoints          = var.alert_email_endpoints
  critical_alert_email_endpoints = var.critical_alert_email_endpoints
  slack_webhook_lambda_arn       = var.slack_webhook_lambda_arn

  alb_arn_suffix             = module.alb.alb_arn_suffix
  rds_instance_identifier    = module.rds.instance_identifier
  redis_replication_group_id = module.redis.replication_group_id
  ecs_cluster_name           = module.ecs.cluster_name
  cloudfront_distribution_id = module.cloudfront.distribution_id

  ecs_service_names  = var.ecs_service_names
  log_retention_days = 90

  rds_cpu_alarm_threshold         = 80
  rds_free_storage_alarm_bytes    = 10737418240
  rds_connections_alarm_threshold = 200
  rds_latency_alarm_threshold     = 0.02

  ecs_cpu_alarm_threshold    = 80
  ecs_memory_alarm_threshold = 80

  app_error_count_alarm_threshold     = 10
  appointment_failure_alarm_threshold = 5
  auth_failure_alarm_threshold        = 50

  enable_budget_alarm      = true
  monthly_budget_limit_usd = var.monthly_budget_limit_usd
}

module "s3_media" {
  source = "../../modules/s3"

  project        = var.project
  environment    = var.environment
  bucket_suffix  = "media"
  bucket_purpose = "Product images, media wall assets, blog images, brochure PDFs — served via CloudFront OAC"

  versioning_enabled    = true
  allow_public_read     = false
  create_cloudfront_oai = true
  kms_key_arn           = null

  cors_allowed_origins = var.allowed_origins
  cors_allowed_methods = ["GET", "HEAD"]

  lifecycle_rules = [
    {
      id      = "transition-to-ia-and-glacier"
      enabled = true
      transitions = [
        { days = 90,  storage_class = "STANDARD_IA" },
        { days = 365, storage_class = "GLACIER" }
      ]
      abort_incomplete_multipart_upload_days = 7
    },
    {
      id                                 = "expire-old-versions"
      enabled                            = true
      noncurrent_version_expiration_days = 90
    }
  ]

  access_log_bucket_id       = module.s3_logs.bucket_id
  enable_size_alarm          = true
  size_alarm_threshold_bytes = 53687091200
  sns_alarm_topic_arns       = [module.monitoring.alerts_topic_arn]
}

module "s3_uploads" {
  source = "../../modules/s3"

  project        = var.project
  environment    = var.environment
  bucket_suffix  = "uploads"
  bucket_purpose = "Temporary user upload staging for brochure requests and appointment assets"

  versioning_enabled = false
  allow_public_read  = false
  kms_key_arn        = module.kms.key_arn

  cors_allowed_origins = var.allowed_origins
  cors_allowed_methods = ["PUT", "POST", "GET", "HEAD"]

  lifecycle_rules = [
    {
      id              = "expire-temp-uploads"
      enabled         = true
      prefix          = "temp/"
      expiration_days = 1
      abort_incomplete_multipart_upload_days = 1
    },
    {
      id              = "expire-processed-uploads"
      enabled         = true
      prefix          = "processed/"
      expiration_days = 30
      abort_incomplete_multipart_upload_days = 3
    }
  ]

  access_log_bucket_id       = module.s3_logs.bucket_id
  sqs_notification_arn       = var.upload_events_sqs_arn
  notification_filter_prefix = "temp/"
}

module "s3_logs" {
  source = "../../modules/s3"

  project        = var.project
  environment    = var.environment
  bucket_suffix  = "logs"
  bucket_purpose = "ALB, CloudFront and S3 server access logs"

  versioning_enabled = false
  allow_public_read  = false

  lifecycle_rules = [
    {
      id              = "expire-logs"
      enabled         = true
      expiration_days = 90
      abort_incomplete_multipart_upload_days = 1
    }
  ]
}

module "s3_backups" {
  source = "../../modules/s3"

  project        = var.project
  environment    = var.environment
  bucket_suffix  = "backups"
  bucket_purpose = "Database snapshots and application data backups with GDPR-compliant archival"

  versioning_enabled = true
  allow_public_read  = false
  kms_key_arn        = module.kms.key_arn

  lifecycle_rules = [
    {
      id      = "archive-backups"
      enabled = true
      transitions = [
        { days = 30,  storage_class = "STANDARD_IA" },
        { days = 90,  storage_class = "GLACIER" },
        { days = 365, storage_class = "DEEP_ARCHIVE" }
      ]
      abort_incomplete_multipart_upload_days = 1
    }
  ]

  access_log_bucket_id = module.s3_logs.bucket_id
}

module "secrets" {
  source = "../../modules/secrets"

  project     = var.project
  environment = var.environment

  create_kms_key = false
  kms_key_arn    = module.kms.key_arn
  deny_non_tls   = true

  secrets = [
    {
      name        = "database/primary"
      description = "PostgreSQL primary database credentials and Prisma connection string"
      group       = "database"
      initial_value = jsonencode({
        host              = module.rds.primary_endpoint
        port              = 5432
        dbname            = var.db_name
        username          = var.db_username
        password          = var.db_password
        connection_string = "postgresql://${var.db_username}:${var.db_password}@${module.rds.primary_endpoint}:5432/${var.db_name}?schema=public&connection_limit=10&pool_timeout=20"
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
      rotation_lambda_arn    = var.db_rotation_lambda_arn
      rotation_days          = 30
    },
    {
      name        = "database/replica"
      description = "PostgreSQL read replica connection string for read-heavy services"
      group       = "database"
      initial_value = jsonencode({
        host              = module.rds.reader_endpoint
        port              = 5432
        dbname            = var.db_name
        username          = var.db_username
        password          = var.db_password
        connection_string = "postgresql://${var.db_username}:${var.db_password}@${module.rds.reader_endpoint}:5432/${var.db_name}?schema=public&connection_limit=5&pool_timeout=10"
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "redis/auth-token"
      description = "Redis AUTH token and primary/reader connection details"
      group       = "cache"
      initial_value = jsonencode({
        auth_token        = var.redis_auth_token
        primary_endpoint  = module.redis.primary_endpoint_address
        reader_endpoint   = module.redis.reader_endpoint_address
        connection_string = "rediss://:${var.redis_auth_token}@${module.redis.primary_endpoint_address}:6379"
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
      rotation_lambda_arn    = var.redis_rotation_lambda_arn
      rotation_days          = 60
    },
    {
      name        = "auth/jwt-secret"
      description = "JWT signing secret for Better Auth token generation and validation"
      group       = "auth"
      initial_value = var.jwt_secret
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
      rotation_lambda_arn    = var.jwt_rotation_lambda_arn
      rotation_days          = 90
    },
    {
      name        = "auth/better-auth-secret"
      description = "Better Auth framework secret key"
      group       = "auth"
      initial_value = var.better_auth_secret
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "stripe/secret-key"
      description = "Stripe LIVE secret API key for payment processing"
      group       = "payments"
      initial_value = var.stripe_secret_key
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "stripe/webhook-secret"
      description = "Stripe live webhook endpoint signing secret"
      group       = "payments"
      initial_value = var.stripe_webhook_secret
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "stripe/restricted-key"
      description = "Stripe restricted API key for read-only reporting and analytics"
      group       = "payments"
      initial_value = var.stripe_restricted_key
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "email/smtp-credentials"
      description = "AWS SES SMTP credentials for transactional email delivery"
      group       = "notifications"
      initial_value = jsonencode({
        host     = var.smtp_host
        port     = var.smtp_port
        username = var.smtp_username
        password = var.smtp_password
        from     = var.smtp_from_address
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "notifications/twilio"
      description = "Twilio account SID and auth token for SMS appointment reminders (FR5.6)"
      group       = "notifications"
      initial_value = jsonencode({
        account_sid = var.twilio_account_sid
        auth_token  = var.twilio_auth_token
        from_number = var.twilio_from_number
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "notifications/firebase"
      description = "Firebase service account JSON for web push notifications"
      group       = "notifications"
      initial_value = var.firebase_service_account_json
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "storage/s3-credentials"
      description = "IAM access key pair scoped to S3 media and uploads buckets"
      group       = "storage"
      initial_value = jsonencode({
        access_key_id     = var.s3_access_key_id
        secret_access_key = var.s3_secret_access_key
        media_bucket      = module.s3_media.bucket_id
        uploads_bucket    = module.s3_uploads.bucket_id
        region            = var.aws_region
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "api-gateway/internal-api-key"
      description = "Internal API key for authenticated inter-service communication via the API gateway"
      group       = "api"
      initial_value = var.internal_api_key
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
      rotation_lambda_arn    = var.api_key_rotation_lambda_arn
      rotation_days          = 90
    },
    {
      name        = "cloudfront/origin-secret"
      description = "X-CloudFront-Secret header value for ALB origin verification"
      group       = "api"
      initial_value = var.cloudfront_origin_secret
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "analytics/google-tag-manager"
      description = "Google Tag Manager container ID and Google Search Console verification token"
      group       = "analytics"
      initial_value = jsonencode({
        gtm_container_id           = var.gtm_container_id
        gsc_verification_token     = var.gsc_verification_token
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    }
  ]

  enable_access_failure_alarm  = true
  cloudtrail_log_group_name    = var.cloudtrail_log_group_name
  sns_alarm_topic_arns         = [module.monitoring.critical_alerts_topic_arn]
}

module "rds" {
  source = "../../modules/rds"

  project     = var.project
  environment = var.environment

  vpc_id                     = module.vpc.vpc_id
  database_subnet_ids        = module.vpc.database_subnet_ids
  allowed_security_group_ids = [module.ecs.service_security_group_id]

  engine_version            = "16.2"
  instance_class            = "db.r7g.large"
  allocated_storage         = 100
  max_allocated_storage     = 1000
  multi_az                  = true
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project}-${var.environment}-final-snapshot"
  backup_retention_period   = 14
  backup_window             = "02:00-03:00"
  maintenance_window        = "sun:04:00-sun:05:00"

  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  monitoring_interval                   = 60
  monitoring_role_arn                   = var.rds_monitoring_role_arn

  kms_key_arn = module.kms.key_arn

  enable_read_replica   = true
  read_replica_class    = "db.r7g.large"

  ca_cert_identifier = "rds-ca-rsa2048-g1"

  sns_alarm_topic_arns = [
    module.monitoring.alerts_topic_arn,
    module.monitoring.critical_alerts_topic_arn
  ]
}

module "redis" {
  source = "../../modules/redis"

  project     = var.project
  environment = var.environment

  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.ecs.service_security_group_id]

  node_type          = "cache.r7g.large"
  num_cache_clusters = 3
  engine_version     = "7.0"
  auth_token         = var.redis_auth_token

  maxmemory_policy         = "allkeys-lru"
  snapshot_retention_limit = 7
  snapshot_window          = "02:00-03:00"
  maintenance_window       = "sun:04:30-sun:05:30"
  log_retention_days       = 30

  cpu_alarm_threshold         = 75
  memory_alarm_threshold      = 75
  connections_alarm_threshold = 1000
  evictions_alarm_threshold   = 50

  sns_alarm_topic_arns = [module.monitoring.alerts_topic_arn]
}

module "alb" {
  source = "../../modules/alb"

  project     = var.project
  environment = var.environment

  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  acm_certificate_arn    = var.acm_certificate_arn
  extra_certificate_arns = var.extra_certificate_arns
  ssl_policy             = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  access_log_bucket_id = module.s3_logs.bucket_id
  waf_web_acl_arn      = null

  idle_timeout = 60

  target_groups = [
    { name = "api-gateway",           port = 3000, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "auth-service",          port = 3001, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "product-service",       port = 3002, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "order-payment-service", port = 3003, target_type = "ip", deregistration_delay = 60,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "appointment-service",   port = 3004, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "content-service",       port = 3005, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "customer-service",      port = 3006, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "notification-service",  port = 3007, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 },
    { name = "analytics-service",     port = 3008, target_type = "ip", deregistration_delay = 30,  health_check_path = "/health", healthy_threshold = 2, unhealthy_threshold = 3, health_check_interval = 15 }
  ]

  listener_rules = [
    { priority = 10, target_group_name = "auth-service",          path_patterns = ["/v1/auth/*"] },
    { priority = 20, target_group_name = "product-service",       path_patterns = ["/v1/products/*", "/v1/categories/*", "/v1/colours/*", "/v1/sizes/*", "/v1/inventory/*", "/v1/pricing/*"] },
    { priority = 30, target_group_name = "order-payment-service", path_patterns = ["/v1/orders/*", "/v1/payments/*", "/v1/webhooks/*", "/v1/invoices/*", "/v1/refunds/*"] },
    { priority = 40, target_group_name = "appointment-service",   path_patterns = ["/v1/appointments/*", "/v1/showrooms/*", "/v1/availability/*", "/v1/consultants/*", "/v1/reminders/*"] },
    { priority = 50, target_group_name = "content-service",       path_patterns = ["/v1/blog/*", "/v1/media/*", "/v1/brochures/*", "/v1/pages/*", "/v1/business/*", "/v1/contact/*", "/v1/seo/*"] },
    { priority = 60, target_group_name = "customer-service",      path_patterns = ["/v1/customers/*", "/v1/reviews/*", "/v1/wishlist/*", "/v1/loyalty/*", "/v1/support/*"] },
    { priority = 70, target_group_name = "notification-service",  path_patterns = ["/v1/notifications/*", "/v1/newsletter/*"] },
    { priority = 80, target_group_name = "analytics-service",     path_patterns = ["/v1/analytics/*"] },
    { priority = 90, target_group_name = "api-gateway",           path_patterns = ["/v1/*"] }
  ]

  alarm_5xx_threshold             = 10
  alarm_4xx_threshold             = 100
  alarm_latency_threshold_seconds = 3
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
  origin_shield_enabled    = true
  origin_shield_region     = var.aws_region
  origin_read_timeout      = 30
  origin_keepalive_timeout = 5

  static_assets_default_ttl = 86400
  static_assets_max_ttl     = 31536000

  content_security_policy = "default-src 'self'; img-src 'self' data: https://${var.primary_domain} https://*.cloudfront.net; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://api.${var.primary_domain}; frame-ancestors 'none';"

  waf_web_acl_arn        = var.waf_web_acl_arn_us_east_1
  log_bucket_domain_name = module.s3_logs.bucket_domain_name

  custom_error_responses = [
    { error_code = 403, response_code = 200, response_page_path = "/index.html", error_caching_min_ttl = 10 },
    { error_code = 404, response_code = 200, response_page_path = "/index.html", error_caching_min_ttl = 10 }
  ]

  alarm_5xx_rate_threshold         = 5
  alarm_4xx_rate_threshold         = 10
  alarm_total_error_rate_threshold = 10
  alarm_origin_latency_ms          = 3000
  sns_alarm_topic_arns             = [module.monitoring.alerts_topic_arn]
}

module "ecs" {
  source = "../../modules/ecs"

  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  target_group_arns       = module.alb.target_group_arns
  alb_security_group_id   = module.alb.security_group_id
  log_group_names         = module.monitoring.application_log_group_names
  secrets_read_policy_arn = module.secrets.read_secrets_policy_arn

  container_image_tag = var.container_image_tag
  ecr_repository_url  = var.ecr_repository_url

  services = {
    api-gateway = {
      cpu           = 1024
      memory        = 2048
      desired_count = 3
      port          = 3000
      environment = {
        NODE_ENV  = "production"
        PORT      = "3000"
        LOG_LEVEL = "warn"
        CDN_URL   = "https://${module.cloudfront.distribution_domain_name}"
      }
      secrets = {
        JWT_SECRET         = "${module.secrets.secret_arns["auth/jwt-secret"]}::"
        BETTER_AUTH_SECRET = "${module.secrets.secret_arns["auth/better-auth-secret"]}::"
        INTERNAL_API_KEY   = "${module.secrets.secret_arns["api-gateway/internal-api-key"]}::"
        CF_ORIGIN_SECRET   = "${module.secrets.secret_arns["cloudfront/origin-secret"]}::"
      }
    }
    auth-service = {
      cpu           = 1024
      memory        = 2048
      desired_count = 3
      port          = 3001
      environment = {
        NODE_ENV  = "production"
        PORT      = "3001"
        LOG_LEVEL = "warn"
      }
      secrets = {
        DATABASE_URL       = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        REDIS_URL          = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
        JWT_SECRET         = "${module.secrets.secret_arns["auth/jwt-secret"]}::"
        BETTER_AUTH_SECRET = "${module.secrets.secret_arns["auth/better-auth-secret"]}::"
      }
    }
    product-service = {
      cpu           = 1024
      memory        = 2048
      desired_count = 3
      port          = 3002
      environment = {
        NODE_ENV  = "production"
        PORT      = "3002"
        LOG_LEVEL = "warn"
      }
      secrets = {
        DATABASE_URL    = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        DATABASE_URL_RO = "${module.secrets.secret_arns["database/replica"]}:connection_string::"
        REDIS_URL       = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
      }
    }
    order-payment-service = {
      cpu           = 1024
      memory        = 2048
      desired_count = 3
      port          = 3003
      environment = {
        NODE_ENV  = "production"
        PORT      = "3003"
        LOG_LEVEL = "warn"
      }
      secrets = {
        DATABASE_URL          = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        REDIS_URL             = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
        STRIPE_SECRET_KEY     = "${module.secrets.secret_arns["stripe/secret-key"]}::"
        STRIPE_WEBHOOK_SECRET = "${module.secrets.secret_arns["stripe/webhook-secret"]}::"
        STRIPE_RESTRICTED_KEY = "${module.secrets.secret_arns["stripe/restricted-key"]}::"
      }
    }
    appointment-service = {
      cpu           = 512
      memory        = 1024
      desired_count = 3
      port          = 3004
      environment = {
        NODE_ENV  = "production"
        PORT      = "3004"
        LOG_LEVEL = "warn"
      }
      secrets = {
        DATABASE_URL  = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        REDIS_URL     = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
        SMTP_HOST     = "${module.secrets.secret_arns["email/smtp-credentials"]}:host::"
        SMTP_USER     = "${module.secrets.secret_arns["email/smtp-credentials"]}:username::"
        SMTP_PASS     = "${module.secrets.secret_arns["email/smtp-credentials"]}:password::"
        SMTP_FROM     = "${module.secrets.secret_arns["email/smtp-credentials"]}:from::"
        TWILIO_SID    = "${module.secrets.secret_arns["notifications/twilio"]}:account_sid::"
        TWILIO_TOKEN  = "${module.secrets.secret_arns["notifications/twilio"]}:auth_token::"
        TWILIO_FROM   = "${module.secrets.secret_arns["notifications/twilio"]}:from_number::"
      }
    }
    content-service = {
      cpu           = 512
      memory        = 1024
      desired_count = 3
      port          = 3005
      environment = {
        NODE_ENV       = "production"
        PORT           = "3005"
        LOG_LEVEL      = "warn"
        S3_BUCKET_NAME = module.s3_media.bucket_id
        S3_REGION      = var.aws_region
        CDN_BASE_URL   = "https://${module.cloudfront.distribution_domain_name}"
      }
      secrets = {
        DATABASE_URL    = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        DATABASE_URL_RO = "${module.secrets.secret_arns["database/replica"]}:connection_string::"
        REDIS_URL       = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
        S3_ACCESS_KEY   = "${module.secrets.secret_arns["storage/s3-credentials"]}:access_key_id::"
        S3_SECRET_KEY   = "${module.secrets.secret_arns["storage/s3-credentials"]}:secret_access_key::"
      }
    }
    customer-service = {
      cpu           = 512
      memory        = 1024
      desired_count = 3
      port          = 3006
      environment = {
        NODE_ENV  = "production"
        PORT      = "3006"
        LOG_LEVEL = "warn"
      }
      secrets = {
        DATABASE_URL    = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        DATABASE_URL_RO = "${module.secrets.secret_arns["database/replica"]}:connection_string::"
        REDIS_URL       = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
      }
    }
    notification-service = {
      cpu           = 512
      memory        = 1024
      desired_count = 3
      port          = 3007
      environment = {
        NODE_ENV  = "production"
        PORT      = "3007"
        LOG_LEVEL = "warn"
      }
      secrets = {
        DATABASE_URL   = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        REDIS_URL      = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
        SMTP_HOST      = "${module.secrets.secret_arns["email/smtp-credentials"]}:host::"
        SMTP_USER      = "${module.secrets.secret_arns["email/smtp-credentials"]}:username::"
        SMTP_PASS      = "${module.secrets.secret_arns["email/smtp-credentials"]}:password::"
        SMTP_FROM      = "${module.secrets.secret_arns["email/smtp-credentials"]}:from::"
        TWILIO_SID     = "${module.secrets.secret_arns["notifications/twilio"]}:account_sid::"
        TWILIO_TOKEN   = "${module.secrets.secret_arns["notifications/twilio"]}:auth_token::"
        TWILIO_FROM    = "${module.secrets.secret_arns["notifications/twilio"]}:from_number::"
        FIREBASE_SA    = "${module.secrets.secret_arns["notifications/firebase"]}::"
      }
    }
    analytics-service = {
      cpu           = 512
      memory        = 1024
      desired_count = 3
      port          = 3008
      environment = {
        NODE_ENV  = "production"
        PORT      = "3008"
        LOG_LEVEL = "warn"
      }
      secrets = {
        DATABASE_URL    = "${module.secrets.secret_arns["database/primary"]}:connection_string::"
        DATABASE_URL_RO = "${module.secrets.secret_arns["database/replica"]}:connection_string::"
        REDIS_URL       = "${module.secrets.secret_arns["redis/auth-token"]}:connection_string::"
        GTM_ID          = "${module.secrets.secret_arns["analytics/google-tag-manager"]}:gtm_container_id::"
      }
    }
  }
}

variable "project" {
  type    = string
  default = "lomash-wood"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "aws_region" {
  type = string
}

variable "primary_domain" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

variable "public_subnet_cidrs" {
  type = list(string)
}

variable "private_subnet_cidrs" {
  type = list(string)
}

variable "database_subnet_cidrs" {
  type = list(string)
}

variable "db_name" {
  type = string
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_rotation_lambda_arn" {
  type    = string
  default = null
}

variable "redis_auth_token" {
  type      = string
  sensitive = true
}

variable "redis_rotation_lambda_arn" {
  type    = string
  default = null
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "jwt_rotation_lambda_arn" {
  type    = string
  default = null
}

variable "better_auth_secret" {
  type      = string
  sensitive = true
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
}

variable "stripe_webhook_secret" {
  type      = string
  sensitive = true
}

variable "stripe_restricted_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "smtp_host" {
  type = string
}

variable "smtp_port" {
  type    = number
  default = 587
}

variable "smtp_username" {
  type      = string
  sensitive = true
}

variable "smtp_password" {
  type      = string
  sensitive = true
}

variable "smtp_from_address" {
  type = string
}

variable "twilio_account_sid" {
  type      = string
  sensitive = true
}

variable "twilio_auth_token" {
  type      = string
  sensitive = true
}

variable "twilio_from_number" {
  type = string
}

variable "firebase_service_account_json" {
  type      = string
  sensitive = true
  default   = ""
}

variable "s3_access_key_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "s3_secret_access_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "internal_api_key" {
  type      = string
  sensitive = true
}

variable "api_key_rotation_lambda_arn" {
  type    = string
  default = null
}

variable "acm_certificate_arn" {
  type = string
}

variable "extra_certificate_arns" {
  type    = list(string)
  default = []
}

variable "cloudfront_acm_certificate_arn" {
  type = string
}

variable "cloudfront_domain_aliases" {
  type    = list(string)
  default = []
}

variable "cloudfront_origin_secret" {
  type      = string
  sensitive = true
}

variable "waf_web_acl_arn_us_east_1" {
  type    = string
  default = null
}

variable "allowed_origins" {
  type    = list(string)
  default = []
}

variable "upload_events_sqs_arn" {
  type    = string
  default = null
}

variable "cloudtrail_log_group_name" {
  type    = string
  default = null
}

variable "rds_monitoring_role_arn" {
  type = string
}

variable "kms_key_administrator_arns" {
  type    = list(string)
  default = []
}

variable "alert_email_endpoints" {
  type    = list(string)
  default = []
}

variable "critical_alert_email_endpoints" {
  type    = list(string)
  default = []
}

variable "slack_webhook_lambda_arn" {
  type    = string
  default = null
}

variable "ecs_service_names" {
  type = list(string)
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
  type = string
}

variable "ecr_repository_url" {
  type = string
}

variable "monthly_budget_limit_usd" {
  type    = string
  default = "1000"
}

variable "gtm_container_id" {
  type    = string
  default = ""
}

variable "gsc_verification_token" {
  type    = string
  default = ""
}
