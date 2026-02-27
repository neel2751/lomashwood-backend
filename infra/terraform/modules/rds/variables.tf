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

variable "rds_security_group_id" {
  description = "Security group ID to attach to the RDS instance"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group for the RDS instance"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key used for RDS storage encryption"
  type        = string
  default     = null
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.2"
}

variable "parameter_group_family" {
  description = "DB parameter group family matching the engine version"
  type        = string
  default     = "postgres16"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.allocated_storage >= 20
    error_message = "allocated_storage must be at least 20 GB for PostgreSQL."
  }
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB (0 = disabled)"
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Name of the default database to create"
  type        = string
  default     = "lomash_wood"
}

variable "master_username" {
  description = "Master database username"
  type        = string
  default     = "lomash_admin"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection on the RDS instance"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups (0 = disabled)"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_period >= 0 && var.backup_retention_period <= 35
    error_message = "backup_retention_period must be between 0 and 35 days."
  }
}

variable "backup_window" {
  description = "Daily time range for automated backups (UTC, 30-minute window)"
  type        = string
  default     = "02:00-02:30"
}

variable "maintenance_window" {
  description = "Weekly time range for maintenance (UTC)"
  type        = string
  default     = "sun:03:00-sun:04:00"
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades during maintenance window"
  type        = bool
  default     = true
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Performance Insights data retention in days (7 or 731)"
  type        = number
  default     = 7

  validation {
    condition     = contains([7, 731], var.performance_insights_retention_period)
    error_message = "performance_insights_retention_period must be 7 (free tier) or 731 (2 years)."
  }
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds (0 = disabled, valid: 1,5,10,15,30,60)"
  type        = number
  default     = 60

  validation {
    condition     = contains([0, 1, 5, 10, 15, 30, 60], var.monitoring_interval)
    error_message = "monitoring_interval must be one of: 0, 1, 5, 10, 15, 30, 60."
  }
}

variable "read_replica_count" {
  description = "Number of read replicas to create (0 = none)"
  type        = number
  default     = 0

  validation {
    condition     = var.read_replica_count >= 0 && var.read_replica_count <= 5
    error_message = "read_replica_count must be between 0 and 5."
  }
}

variable "read_replica_instance_class" {
  description = "Instance class for read replicas (defaults to main instance class if null)"
  type        = string
  default     = null
}

variable "db_parameters" {
  description = "Additional custom DB parameter group parameters"
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string, "immediate")
  }))
  default = []
}

variable "max_connections_alarm_threshold" {
  description = "Connection count threshold for CloudWatch alarm"
  type        = number
  default     = 100
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
