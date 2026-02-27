output "secret_arns" {
  description = "Map of secret name to ARN for all created secrets"
  value = {
    for k, s in aws_secretsmanager_secret.secrets :
    k => s.arn
  }
}

output "secret_ids" {
  description = "Map of secret name to ID (full path) for all created secrets"
  value = {
    for k, s in aws_secretsmanager_secret.secrets :
    k => s.id
  }
}

output "secret_version_ids" {
  description = "Map of secret name to current version ID for secrets with an initial value"
  value = {
    for k, v in aws_secretsmanager_secret_version.secrets :
    k => v.version_id
  }
}

output "kms_key_arn" {
  description = "ARN of the created KMS key (null if create_kms_key = false)"
  value       = var.create_kms_key ? aws_kms_key.secrets[0].arn : null
}

output "kms_key_id" {
  description = "ID of the created KMS key (null if create_kms_key = false)"
  value       = var.create_kms_key ? aws_kms_key.secrets[0].key_id : null
}

output "kms_key_alias_arn" {
  description = "ARN of the KMS key alias (null if create_kms_key = false)"
  value       = var.create_kms_key ? aws_kms_alias.secrets[0].arn : null
}

output "read_secrets_policy_arn" {
  description = "ARN of the IAM policy that grants read access to all secrets in this module"
  value       = aws_iam_policy.read_secrets.arn
}

output "write_secrets_policy_arn" {
  description = "ARN of the IAM policy that grants write access to all secrets in this module"
  value       = aws_iam_policy.write_secrets.arn
}

output "access_failure_alarm_arn" {
  description = "ARN of the CloudWatch alarm for Secrets Manager access failures (null if not created)"
  value       = var.enable_access_failure_alarm && length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.secret_access_failure[0].arn : null
}

output "unauthorized_access_alarm_arn" {
  description = "ARN of the CloudWatch alarm for unauthorized secret access (null if not created)"
  value       = var.cloudtrail_log_group_name != null && length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.unauthorized_secret_access[0].arn : null
}
