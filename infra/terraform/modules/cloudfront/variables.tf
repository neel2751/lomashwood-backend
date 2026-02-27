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

variable "domain_aliases" {
  description = "List of CNAME aliases (custom domains) for the CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ARN of an ACM certificate in us-east-1 for the distribution. Must be in us-east-1 regardless of stack region."
  type        = string
  default     = null
}

variable "default_root_object" {
  description = "Object to return when the root URL is requested (e.g. index.html for SPAs)"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront price class controlling which edge locations are used"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.price_class)
    error_message = "price_class must be one of: PriceClass_All, PriceClass_200, PriceClass_100."
  }
}

variable "s3_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 media bucket origin. Null skips S3 origin creation."
  type        = string
  default     = null
}

variable "alb_dns_name" {
  description = "DNS name of the ALB to use as the API/dynamic content origin. Null skips ALB origin creation."
  type        = string
  default     = null
}

variable "cloudfront_origin_secret" {
  description = "Secret header value sent to the ALB origin to ensure requests come through CloudFront only"
  type        = string
  sensitive   = true
  default     = ""
}

variable "origin_shield_enabled" {
  description = "Enable CloudFront Origin Shield to reduce origin load and improve cache hit ratio"
  type        = bool
  default     = false
}

variable "origin_shield_region" {
  description = "AWS region for Origin Shield (should be closest to origin infrastructure)"
  type        = string
  default     = "eu-west-1"
}

variable "origin_read_timeout" {
  description = "Seconds CloudFront waits for a response from the ALB origin"
  type        = number
  default     = 30
  validation {
    condition     = var.origin_read_timeout >= 1 && var.origin_read_timeout <= 180
    error_message = "origin_read_timeout must be between 1 and 180 seconds."
  }
}

variable "origin_keepalive_timeout" {
  description = "Seconds CloudFront maintains a persistent connection to the ALB origin"
  type        = number
  default     = 5
  validation {
    condition     = var.origin_keepalive_timeout >= 1 && var.origin_keepalive_timeout <= 60
    error_message = "origin_keepalive_timeout must be between 1 and 60 seconds."
  }
}

variable "static_assets_default_ttl" {
  description = "Default TTL in seconds for static asset cache behaviours (images, fonts, etc.)"
  type        = number
  default     = 86400
}

variable "static_assets_max_ttl" {
  description = "Maximum TTL in seconds for static asset cache behaviours"
  type        = number
  default     = 31536000
}

variable "content_security_policy" {
  description = "Content-Security-Policy header value applied to all responses"
  type        = string
  default     = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
}

variable "geo_restriction_type" {
  description = "Type of geographic restriction: none, whitelist, or blacklist"
  type        = string
  default     = "none"
  validation {
    condition     = contains(["none", "whitelist", "blacklist"], var.geo_restriction_type)
    error_message = "geo_restriction_type must be one of: none, whitelist, blacklist."
  }
}

variable "geo_restriction_locations" {
  description = "ISO 3166-1 alpha-2 country codes for geo restriction (only applies when type is not none)"
  type        = list(string)
  default     = []
}

variable "custom_error_responses" {
  description = "List of custom error response configurations"
  type = list(object({
    error_code            = number
    response_code         = number
    response_page_path    = string
    error_caching_min_ttl = optional(number, 10)
  }))
  default = [
    {
      error_code            = 403
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 10
    },
    {
      error_code            = 404
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 10
    }
  ]
}

variable "additional_cache_behaviors" {
  description = "Additional ordered cache behaviours to attach to the distribution"
  type = list(object({
    path_pattern     = string
    allowed_methods  = list(string)
    cached_methods   = list(string)
    target_origin_id = string
    cache_policy_id  = optional(string)
  }))
  default = []
}

variable "waf_web_acl_arn" {
  description = "ARN of a WAFv2 WebACL (must be in us-east-1) to associate with the distribution. Null skips WAF."
  type        = string
  default     = null
}

variable "log_bucket_domain_name" {
  description = "Domain name of the S3 bucket that receives CloudFront access logs (must end in .s3.amazonaws.com)"
  type        = string
}

variable "sns_alarm_topic_arns" {
  description = "List of SNS topic ARNs to notify when CloudWatch alarms trigger"
  type        = list(string)
  default     = []
}

variable "alarm_5xx_rate_threshold" {
  description = "5xx error rate percentage threshold that triggers the CloudWatch alarm"
  type        = number
  default     = 5
}

variable "alarm_4xx_rate_threshold" {
  description = "4xx error rate percentage threshold that triggers the CloudWatch alarm"
  type        = number
  default     = 10
}

variable "alarm_total_error_rate_threshold" {
  description = "Total error rate percentage threshold that triggers the CloudWatch alarm"
  type        = number
  default     = 10
}

variable "alarm_origin_latency_ms" {
  description = "p95 origin latency in milliseconds that triggers the latency CloudWatch alarm"
  type        = number
  default     = 3000
}
