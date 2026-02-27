output "alerts_topic_arn" {
  description = "ARN of the general alerts SNS topic"
  value       = aws_sns_topic.alerts.arn
}

output "alerts_topic_name" {
  description = "Name of the general alerts SNS topic"
  value       = aws_sns_topic.alerts.name
}

output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "critical_alerts_topic_name" {
  description = "Name of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch system overview dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch system overview dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "application_log_group_names" {
  description = "Map of ECS service name to CloudWatch log group name"
  value = {
    for k, lg in aws_cloudwatch_log_group.application_logs :
    k => lg.name
  }
}

output "application_log_group_arns" {
  description = "Map of ECS service name to CloudWatch log group ARN"
  value = {
    for k, lg in aws_cloudwatch_log_group.application_logs :
    k => lg.arn
  }
}

output "rds_cpu_alarm_arn" {
  description = "ARN of the CloudWatch alarm for RDS CPU utilisation"
  value       = aws_cloudwatch_metric_alarm.rds_cpu_high.arn
}

output "rds_free_storage_alarm_arn" {
  description = "ARN of the CloudWatch alarm for RDS free storage space"
  value       = aws_cloudwatch_metric_alarm.rds_free_storage_low.arn
}

output "rds_connections_alarm_arn" {
  description = "ARN of the CloudWatch alarm for RDS connection count"
  value       = aws_cloudwatch_metric_alarm.rds_connections_high.arn
}

output "rds_read_latency_alarm_arn" {
  description = "ARN of the CloudWatch alarm for RDS read latency"
  value       = aws_cloudwatch_metric_alarm.rds_read_latency_high.arn
}

output "ecs_cpu_alarm_arns" {
  description = "Map of ECS service name to CPU utilisation alarm ARN"
  value = {
    for k, alarm in aws_cloudwatch_metric_alarm.ecs_cpu_high :
    k => alarm.arn
  }
}

output "ecs_memory_alarm_arns" {
  description = "Map of ECS service name to memory utilisation alarm ARN"
  value = {
    for k, alarm in aws_cloudwatch_metric_alarm.ecs_memory_high :
    k => alarm.arn
  }
}

output "app_error_rate_alarm_arns" {
  description = "Map of ECS service name to application error rate alarm ARN"
  value = {
    for k, alarm in aws_cloudwatch_metric_alarm.application_error_rate_high :
    k => alarm.arn
  }
}

output "stripe_webhook_failure_alarm_arn" {
  description = "ARN of the CloudWatch alarm for Stripe webhook processing failures"
  value       = aws_cloudwatch_metric_alarm.stripe_webhook_failures.arn
}

output "appointment_booking_failure_alarm_arn" {
  description = "ARN of the CloudWatch alarm for appointment booking failures"
  value       = aws_cloudwatch_metric_alarm.appointment_booking_failures.arn
}

output "auth_failure_alarm_arn" {
  description = "ARN of the CloudWatch alarm for authentication failures (brute-force detection)"
  value       = aws_cloudwatch_metric_alarm.auth_failures_high.arn
}
