output "bucket_id" {
  description = "Name (ID) of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "Bucket domain name (e.g. bucket.s3.amazonaws.com)"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional bucket domain name for path-style access"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "bucket_region" {
  description = "AWS region where the bucket resides"
  value       = aws_s3_bucket.main.region
}

output "versioning_status" {
  description = "Current versioning status of the bucket"
  value       = aws_s3_bucket_versioning.main.versioning_configuration[0].status
}

output "cloudfront_oai_id" {
  description = "CloudFront Origin Access Identity ID (empty if not created)"
  value       = var.create_cloudfront_oai ? aws_cloudfront_origin_access_identity.main[0].id : null
}

output "cloudfront_oai_iam_arn" {
  description = "IAM ARN of the CloudFront Origin Access Identity (empty if not created)"
  value       = var.create_cloudfront_oai ? aws_cloudfront_origin_access_identity.main[0].iam_arn : null
}

output "cloudfront_oai_cloudfront_access_identity_path" {
  description = "CloudFront access identity path for use in CloudFront distribution origin config"
  value       = var.create_cloudfront_oai ? aws_cloudfront_origin_access_identity.main[0].cloudfront_access_identity_path : null
}

output "size_alarm_arn" {
  description = "ARN of the CloudWatch bucket size alarm (empty if not created)"
  value       = var.enable_size_alarm && length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.bucket_size[0].arn : null
}
