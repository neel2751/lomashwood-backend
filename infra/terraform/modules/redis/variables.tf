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

variable "vpc_id" {
  description = "VPC ID where the ElastiCache cluster will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the ElastiCache subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "List of security group IDs allowed to connect to Redis"
  type        = list(string)
  default     = []
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (nodes) in the replication group. Use 2+ for HA."
  type        = number
  default     = 1
  validation {
    condition     = var.num_cache_clusters >= 1 && var.num_cache_clusters <= 6
    error_message = "num_cache_clusters must be between 1 and 6."
  }
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "auth_token" {
  description = "AUTH token for Redis (must be 16-128 chars, used with transit_encryption_enabled)"
  type        = string
  sensitive   = true
}

variable "maxmemory_policy" {
  description = "Redis maxmemory eviction policy"
  type        = string
  default     = "allkeys-lru"
  validation {
    condition = contains([
      "noeviction",
      "allkeys-lru",
      "volatile-lru",
      "allkeys-random",
      "volatile-random",
      "volatile-ttl",
      "allkeys-lfu",
      "volatile-lfu"
    ], var.maxmemory_policy)
    error_message = "Invalid maxmemory_policy value."
  }
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain automatic snapshots (0 disables snapshots)"
  type        = number
  default     = 1
}

variable "snapshot_window" {
  description = "Daily time range (UTC) during which ElastiCache takes snapshots"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Weekly time range for maintenance (ddd:hh24:mi-ddd:hh24:mi)"
  type        = string
  default     = "sun:05:00-sun:06:00"
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "sns_alarm_topic_arns" {
  description = "List of SNS topic ARNs to notify when CloudWatch alarms trigger"
  type        = list(string)
  default     = []
}

variable "cpu_alarm_threshold" {
  description = "CPU utilization percentage threshold for CloudWatch alarm"
  type        = number
  default     = 80
}

variable "memory_alarm_threshold" {
  description = "Memory usage percentage threshold for CloudWatch alarm"
  type        = number
  default     = 80
}

variable "connections_alarm_threshold" {
  description = "Number of connections threshold for CloudWatch alarm"
  type        = number
  default     = 500
}

variable "evictions_alarm_threshold" {
  description = "Number of evictions threshold for CloudWatch alarm"
  type        = number
  default     = 100
}
