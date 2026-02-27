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

variable "secrets" {
  description = "List of secrets to create in AWS Secrets Manager"
  type = list(object({
    name                  = string
    description           = string
    group                 = string
    initial_value         = optional(string)
    allowed_principal_arns = optional(list(string), [])
    rotation_lambda_arn   = optional(string)
    rotation_days         = optional(number, 30)
  }))
  default = []

  validation {
    condition     = alltrue([for s in var.secrets : can(regex("^[a-zA-Z0-9/_+=.@-]+$", s.name))])
    error_message = "Secret names may only contain alphanumeric characters and the following: /_+=.@-"
  }
}

variable "kms_key_arn" {
  description = "ARN of an existing KMS key to encrypt secrets. If null and create_kms_key is false, the AWS-managed key is used."
  type        = string
  default     = null
}

variable "create_kms_key" {
  description = "Create a dedicated KMS key for this environment's secrets"
  type        = bool
  default     = false
}

variable "kms_key_user_arns" {
  description = "List of IAM principal ARNs that can use the created KMS key (only applies when create_kms_key = true)"
  type        = list(string)
  default     = []
}

variable "deny_non_tls" {
  description = "Add a Deny statement to secret policies rejecting non-TLS requests"
  type        = bool
  default     = true
}

variable "enable_access_failure_alarm" {
  description = "Enable a CloudWatch alarm when Secrets Manager access operations fail"
  type        = bool
  default     = false
}

variable "cloudtrail_log_group_name" {
  description = "CloudWatch log group name that receives CloudTrail events. Required for unauthorized-access metric filter and alarm."
  type        = string
  default     = null
}

variable "sns_alarm_topic_arns" {
  description = "List of SNS topic ARNs to notify when CloudWatch alarms trigger"
  type        = list(string)
  default     = []
}
