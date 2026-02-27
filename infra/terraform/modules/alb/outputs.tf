output "alb_id" {
  description = "ID of the Application Load Balancer"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ARN suffix of the ALB for use in CloudWatch metric dimensions"
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Canonical hosted zone ID of the ALB for use with Route 53 alias records"
  value       = aws_lb.main.zone_id
}

output "security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "http_listener_arn" {
  description = "ARN of the HTTP (port 80) listener that redirects to HTTPS"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "ARN of the HTTPS (port 443) listener"
  value       = aws_lb_listener.https.arn
}

output "target_group_arns" {
  description = "Map of target group name to ARN"
  value = {
    for k, tg in aws_lb_target_group.services :
    k => tg.arn
  }
}

output "target_group_arn_suffixes" {
  description = "Map of target group name to ARN suffix for use in CloudWatch metric dimensions"
  value = {
    for k, tg in aws_lb_target_group.services :
    k => tg.arn_suffix
  }
}

output "target_group_names" {
  description = "Map of target group name key to full AWS name"
  value = {
    for k, tg in aws_lb_target_group.services :
    k => tg.name
  }
}

output "alb_5xx_alarm_arn" {
  description = "ARN of the CloudWatch alarm for ALB 5xx errors (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.alb_5xx[0].arn : null
}

output "alb_4xx_alarm_arn" {
  description = "ARN of the CloudWatch alarm for ALB 4xx errors (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.alb_4xx[0].arn : null
}

output "alb_target_5xx_alarm_arn" {
  description = "ARN of the CloudWatch alarm for target 5xx errors (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.alb_target_5xx[0].arn : null
}

output "alb_latency_alarm_arn" {
  description = "ARN of the CloudWatch p95 latency alarm (null if not created)"
  value       = length(var.sns_alarm_topic_arns) > 0 ? aws_cloudwatch_metric_alarm.alb_latency[0].arn : null
}

output "unhealthy_host_alarm_arns" {
  description = "Map of target group name to unhealthy host alarm ARN"
  value = {
    for k, alarm in aws_cloudwatch_metric_alarm.alb_unhealthy_hosts :
    k => alarm.arn
  }
}
