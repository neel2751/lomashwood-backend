output "distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "distribution_domain_name" {
  description = "Domain name of the CloudFront distribution (e.g. d111111abcdef8.cloudfront.net)"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront hosted zone ID for use with Route 53 alias records (always Z2FDTNDATAQYW2)"
  value       = aws_cloudfront_distribution.main.hosted_zone_id
}

output "distribution_etag" {
  description = "Current version of the distribution's information (ETag)"
  value       = aws_cloudfront_distribution.main.etag
}

output "distribution_status" {
  description = "Current status of the distribution (Deployed or InProgress)"
  value       = aws_cloudfront_distribution.main.status
}

output "s3_origin_access_control_id" {
  description = "ID of the S3 Origin Access Control (null if S3 origin not configured)"
  value       = var.s3_bucket_regional_domain_name != null ? aws_cloudfront_origin_access_control.s3[0].id : null
}

output "static_assets_cache_policy_id" {
  description = "ID of the static assets cache policy"
  value       = aws_cloudfront_cache_policy.static_assets.id
}

output "api_cache_policy_id" {
  description = "ID of the API (no-cache) cache policy"
  value       = aws_cloudfront_cache_policy.api.id
}

output "api_origin_request_policy_id" {
  description = "ID of the API origin request policy (forwards all headers, cookies, query strings)"
  value       = aws_cloudfront_origin_request_policy.api.id
}

output "security_headers_policy_id" {
  description = "ID of the security response headers policy"
  value       = aws_cloudfront_response_headers_policy.security_headers.id
}

output "cdn_5xx_alarm_arn" {
  description = "ARN of the CloudWatch alarm for 5xx error rate (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.cdn_5xx_rate[0].arn : null
}

output "cdn_4xx_alarm_arn" {
  description = "ARN of the CloudWatch alarm for 4xx error rate (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.cdn_4xx_rate[0].arn : null
}

output "cdn_total_error_alarm_arn" {
  description = "ARN of the CloudWatch alarm for total error rate (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.cdn_total_error_rate[0].arn : null
}

output "cdn_origin_latency_alarm_arn" {
  description = "ARN of the CloudWatch alarm for p95 origin latency (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.cdn_origin_latency[0].arn : null
}
