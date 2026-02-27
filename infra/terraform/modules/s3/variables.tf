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

variable "bucket_suffix" {
  description = "Suffix appended to the bucket name to indicate its purpose (e.g. media, uploads, logs, backups)"
  type        = string
}

variable "bucket_purpose" {
  description = "Human-readable description of what the bucket stores, used for tagging"
  type        = string
  default     = "general"
}

variable "versioning_enabled" {
  description = "Enable S3 object versioning"
  type        = bool
  default     = false
}

variable "kms_key_arn" {
  description = "ARN of a KMS key for server-side encryption. If null, AES256 (SSE-S3) is used."
  type        = string
  default     = null
}

variable "allow_public_read" {
  description = "Allow unauthenticated public read access to objects (e.g. for CDN-served media)"
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins. Leave empty to skip CORS configuration."
  type        = list(string)
  default     = []
}

variable "cors_allowed_headers" {
  description = "List of allowed CORS headers"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "List of allowed CORS HTTP methods"
  type        = list(string)
  default     = ["GET", "PUT", "POST", "DELETE", "HEAD"]
}

variable "cors_expose_headers" {
  description = "List of headers to expose in CORS responses"
  type        = list(string)
  default     = ["ETag"]
}

variable "cors_max_age_seconds" {
  description = "Time in seconds that the browser may cache the CORS preflight response"
  type        = number
  default     = 3600
}

variable "lifecycle_rules" {
  description = "List of lifecycle rules to apply to the bucket"
  type = list(object({
    id                                    = string
    enabled                               = bool
    prefix                                = optional(string)
    expiration_days                       = optional(number)
    noncurrent_version_expiration_days    = optional(number)
    abort_incomplete_multipart_upload_days = optional(number)
    transitions = optional(list(object({
      days          = number
      storage_class = string
    })))
  }))
  default = []
}

variable "access_log_bucket_id" {
  description = "ID of the bucket to write S3 access logs to. Null disables logging."
  type        = string
  default     = null
}

variable "sqs_notification_arn" {
  description = "SQS queue ARN to receive S3 event notifications. Null disables SQS notifications."
  type        = string
  default     = null
}

variable "sns_notification_arn" {
  description = "SNS topic ARN to receive S3 event notifications. Null disables SNS notifications."
  type        = string
  default     = null
}

variable "notification_events" {
  description = "List of S3 event types that trigger notifications"
  type        = list(string)
  default     = ["s3:ObjectCreated:*"]
}

variable "notification_filter_prefix" {
  description = "Object key prefix filter for notifications"
  type        = string
  default     = null
}

variable "notification_filter_suffix" {
  description = "Object key suffix filter for notifications"
  type        = string
  default     = null
}

variable "additional_policy_statements" {
  description = "Additional IAM policy statements to attach to the bucket policy"
  type        = list(any)
  default     = []
}

variable "create_cloudfront_oai" {
  description = "Create a CloudFront Origin Access Identity for this bucket (mutually exclusive with allow_public_read)"
  type        = bool
  default     = false
}

variable "enable_size_alarm" {
  description = "Enable a CloudWatch alarm when bucket size exceeds threshold"
  type        = bool
  default     = false
}

variable "size_alarm_threshold_bytes" {
  description = "Bucket size in bytes that triggers the CloudWatch size alarm"
  type        = number
  default     = 10737418240
}

variable "sns_alarm_topic_arns" {
  description = "List of SNS topic ARNs to notify when CloudWatch alarms trigger"
  type        = list(string)
  default     = []
}
