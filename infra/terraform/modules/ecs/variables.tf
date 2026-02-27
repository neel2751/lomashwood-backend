variable "project" {
  description = "Project name used as a prefix for all resource names"
  type        = string
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
  description = "AWS region where resources will be created"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS task placement"
  type        = list(string)
}

variable "ecs_tasks_security_group_id" {
  description = "Security group ID to attach to ECS tasks"
  type        = string
}

variable "capacity_providers" {
  description = "List of capacity providers to associate with the ECS cluster"
  type        = list(string)
  default     = ["FARGATE", "FARGATE_SPOT"]
}

variable "default_capacity_provider_strategy" {
  description = "Default capacity provider strategy for the cluster"
  type = list(object({
    capacity_provider = string
    weight            = number
    base              = optional(number, 0)
  }))
  default = [
    {
      capacity_provider = "FARGATE"
      weight            = 1
      base              = 1
    }
  ]
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for the ECS cluster"
  type        = bool
  default     = true
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for interactive debugging into running containers"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs for ECS services"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "log_retention_days must be a valid CloudWatch log retention value."
  }
}

variable "service_names" {
  description = "List of service names for creating CloudWatch log groups upfront"
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

variable "services" {
  description = "List of ECS service definitions to create"
  type = list(object({
    name              = string
    image             = string
    cpu               = number
    memory            = number
    desired_count     = number
    container_port    = number
    target_group_arn  = optional(string)
    environment       = optional(map(string), {})
    secrets           = optional(map(string), {})
    health_check_grace_period = optional(number, 60)
    health_check = optional(object({
      command      = string
      interval     = optional(number, 30)
      timeout      = optional(number, 5)
      retries      = optional(number, 3)
      start_period = optional(number, 60)
    }))
    autoscaling = optional(object({
      min_capacity       = number
      max_capacity       = number
      cpu_target         = optional(number, 70)
      memory_target      = optional(number, 80)
      scale_in_cooldown  = optional(number, 300)
      scale_out_cooldown = optional(number, 60)
    }))
  }))
  default = []
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications (optional)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
