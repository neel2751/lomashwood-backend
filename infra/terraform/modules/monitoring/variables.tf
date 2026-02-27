variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "lomash-wood"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "aws_region" {
  description = "Primary AWS region where resources are deployed"
  type        = string
  default     = "eu-west-1"
}

variable "kms_key_arn" {
  description = "ARN of a KMS key used to encrypt SNS topics and CloudWatch log groups. Null uses AWS-managed keys."
  type        = string
  default     = null
}

variable "alert_email_endpoints" {
  description = "List of email addresses to subscribe to the general alerts SNS topic"
  type        = list(string)
  default     = []
}

variable "critical_alert_email_endpoints" {
  description = "List of email addresses to subscribe to the critical alerts SNS topic"
  type        = list(string)
  default     = []
}

variable "slack_webhook_lambda_arn" {
  description = "ARN of a Lambda function that forwards SNS notifications to Slack. Null disables Slack integration."
  type        = string
  default     = null
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the Application Load Balancer for CloudWatch metric dimensions"
  type        = string
}

variable "rds_instance_identifier" {
  description = "Identifier of the primary RDS PostgreSQL instance for CloudWatch metrics and alarms"
  type        = string
}

variable "redis_replication_group_id" {
  description = "ID of the ElastiCache Redis replication group for CloudWatch metrics"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster that runs all Lomash Wood services"
  type        = string
}

variable "ecs_service_names" {
  description = "List of ECS service names to create log groups, metric filters, and alarms for"
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

  validation {
    condition     = length(var.ecs_service_names) > 0
    error_message = "At least one ECS service name must be provided."
  }
}

variable "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for CDN metrics on the dashboard"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch log groups for ECS services"
  type        = number
  default     = 30

  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365,
      400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653
    ], var.log_retention_days)
    error_message = "log_retention_days must be a valid CloudWatch Logs retention value."
  }
}

variable "rds_cpu_alarm_threshold" {
  description = "RDS CPU utilisation percentage threshold for CloudWatch alarm"
  type        = number
  default     = 80
}

variable "rds_free_storage_alarm_bytes" {
  description = "RDS free storage space in bytes below which the critical alarm triggers"
  type        = number
  default     = 5368709120
}

variable "rds_connections_alarm_threshold" {
  description = "RDS database connection count threshold for CloudWatch alarm"
  type        = number
  default     = 100
}

variable "rds_latency_alarm_threshold" {
  description = "RDS read/write latency in seconds threshold for CloudWatch alarm"
  type        = number
  default     = 0.02
}

variable "ecs_cpu_alarm_threshold" {
  description = "ECS service CPU utilisation percentage threshold for CloudWatch alarm"
  type        = number
  default     = 80
}

variable "ecs_memory_alarm_threshold" {
  description = "ECS service memory utilisation percentage threshold for CloudWatch alarm"
  type        = number
  default     = 80
}

variable "app_error_count_alarm_threshold" {
  description = "Number of application ERROR log events per minute that triggers the alarm"
  type        = number
  default     = 10
}

variable "stripe_webhook_failure_alarm_threshold" {
  description = "Number of Stripe webhook failures per 5 minutes that triggers the critical alarm"
  type        = number
  default     = 0
}

variable "appointment_failure_alarm_threshold" {
  description = "Number of appointment booking failures per 5 minutes that triggers the alarm"
  type        = number
  default     = 5
}

variable "auth_failure_alarm_threshold" {
  description = "Number of authentication failures per 5 minutes that triggers the critical alarm (brute-force detection)"
  type        = number
  default     = 50
}

variable "enable_budget_alarm" {
  description = "Enable AWS Budgets monthly cost alarm"
  type        = bool
  default     = false
}

variable "monthly_budget_limit_usd" {
  description = "Monthly AWS spend budget limit in USD. Alerts at 80% actual and 100% forecasted."
  type        = string
  default     = "500"
}
