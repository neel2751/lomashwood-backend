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
  description = "VPC ID where the ALB will be deployed"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for an internet-facing ALB"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for an internal ALB"
  type        = list(string)
  default     = []
}

variable "internal" {
  description = "Set to true to create an internal (private) ALB instead of internet-facing"
  type        = bool
  default     = false
}

variable "ingress_cidr_blocks" {
  description = "CIDR blocks allowed to reach the ALB on ports 80 and 443"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "idle_timeout" {
  description = "Idle connection timeout in seconds"
  type        = number
  default     = 60
}

variable "acm_certificate_arn" {
  description = "ARN of the primary ACM certificate for the HTTPS listener"
  type        = string
}

variable "extra_certificate_arns" {
  description = "Additional ACM certificate ARNs to attach to the HTTPS listener (for extra domains)"
  type        = list(string)
  default     = []
}

variable "ssl_policy" {
  description = "SSL/TLS security policy for the HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "access_log_bucket_id" {
  description = "S3 bucket ID to deliver ALB access logs. Leave empty to disable."
  type        = string
  default     = ""
}

variable "target_groups" {
  description = "List of target group definitions to create"
  type = list(object({
    name                 = string
    port                 = number
    target_type          = optional(string, "ip")
    deregistration_delay = optional(number, 30)
    stickiness_enabled   = optional(bool, false)
    health_check_path    = optional(string, "/health")
    health_check_timeout = optional(number, 5)
    health_check_interval = optional(number, 30)
    health_check_matcher = optional(string, "200")
    healthy_threshold    = optional(number, 3)
    unhealthy_threshold  = optional(number, 3)
  }))
  default = []
}

variable "listener_rules" {
  description = "List of HTTPS listener routing rules"
  type = list(object({
    priority          = number
    target_group_name = string
    path_patterns     = optional(list(string))
    host_headers      = optional(list(string))
    http_headers = optional(list(object({
      name   = string
      values = list(string)
    })))
  }))
  default = []

  validation {
    condition     = alltrue([for r in var.listener_rules : r.priority >= 1 && r.priority <= 50000])
    error_message = "Listener rule priorities must be between 1 and 50000."
  }
}

variable "waf_web_acl_arn" {
  description = "ARN of an AWS WAFv2 WebACL to associate with the ALB. Null skips WAF association."
  type        = string
  default     = null
}

variable "sns_alarm_topic_arns" {
  description = "List of SNS topic ARNs to notify when CloudWatch alarms trigger"
  type        = list(string)
  default     = []
}

variable "alarm_5xx_threshold" {
  description = "Number of 5xx responses per minute that triggers the CloudWatch alarm"
  type        = number
  default     = 10
}

variable "alarm_4xx_threshold" {
  description = "Number of 4xx responses per minute that triggers the CloudWatch alarm"
  type        = number
  default     = 100
}

variable "alarm_latency_threshold_seconds" {
  description = "p95 target response time in seconds that triggers the latency CloudWatch alarm"
  type        = number
  default     = 3
}
