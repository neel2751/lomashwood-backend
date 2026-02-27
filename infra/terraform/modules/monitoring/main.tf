locals {
  name_prefix = "${var.project}-${var.environment}"
}

resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = var.kms_key_arn

  tags = {
    Name        = "${local.name_prefix}-alerts"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_sns_topic" "critical_alerts" {
  name              = "${local.name_prefix}-critical-alerts"
  kms_master_key_id = var.kms_key_arn

  tags = {
    Name        = "${local.name_prefix}-critical-alerts"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_sns_topic_subscription" "alert_email" {
  for_each = toset(var.alert_email_endpoints)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_sns_topic_subscription" "critical_alert_email" {
  for_each = toset(var.critical_alert_email_endpoints)

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_sns_topic_subscription" "alert_slack" {
  count = var.slack_webhook_lambda_arn != null ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = var.slack_webhook_lambda_arn
}

resource "aws_sns_topic_subscription" "critical_alert_slack" {
  count = var.slack_webhook_lambda_arn != null ? 1 : 0

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "lambda"
  endpoint  = var.slack_webhook_lambda_arn
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "## ${var.project} — ${var.environment} — System Overview"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "ALB — Request Count"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", period = 60 }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "ALB — 5xx Error Rate"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", period = 60, color = "#d62728" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", period = 60, color = "#ff7f0e" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "ALB — p95 Target Response Time (s)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { stat = "p95", period = 60, color = "#1f77b4" }]
          ]
          annotations = {
            horizontal = [{ value = 3, label = "SRS NFR1.1 Threshold (3s)", color = "#d62728" }]
          }
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 7
        width  = 24
        height = 1
        properties = {
          markdown = "### Database (RDS PostgreSQL)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 8
        width  = 8
        height = 6
        properties = {
          title  = "RDS — CPU Utilisation (%)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_identifier, { stat = "Average", period = 60 }]
          ]
          annotations = {
            horizontal = [{ value = 80, label = "Threshold", color = "#d62728" }]
          }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 8
        width  = 8
        height = 6
        properties = {
          title  = "RDS — Free Storage Space (GB)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.rds_instance_identifier, { stat = "Average", period = 300 }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 8
        width  = 8
        height = 6
        properties = {
          title  = "RDS — DB Connections"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_identifier, { stat = "Average", period = 60 }]
          ]
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 14
        width  = 24
        height = 1
        properties = {
          markdown = "### Cache (ElastiCache Redis)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 15
        width  = 8
        height = 6
        properties = {
          title  = "Redis — CPU Utilisation (%)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/ElastiCache", "EngineCPUUtilization", "ReplicationGroupId", var.redis_replication_group_id, { stat = "Average", period = 60 }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 15
        width  = 8
        height = 6
        properties = {
          title  = "Redis — Memory Usage (%)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "ReplicationGroupId", var.redis_replication_group_id, { stat = "Average", period = 60 }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 15
        width  = 8
        height = 6
        properties = {
          title  = "Redis — Cache Hit Rate (%)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            ["AWS/ElastiCache", "CacheHitRate", "ReplicationGroupId", var.redis_replication_group_id, { stat = "Average", period = 60 }]
          ]
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 21
        width  = 24
        height = 1
        properties = {
          markdown = "### ECS Services — CPU & Memory"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 22
        width  = 12
        height = 6
        properties = {
          title  = "ECS — CPU Reservation (%)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            for svc in var.ecs_service_names :
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", svc, { stat = "Average", period = 60 }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 22
        width  = 12
        height = 6
        properties = {
          title  = "ECS — Memory Reservation (%)"
          view   = "timeSeries"
          region = var.aws_region
          metrics = [
            for svc in var.ecs_service_names :
            ["AWS/ECS", "MemoryUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", svc, { stat = "Average", period = 60 }]
          ]
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 28
        width  = 24
        height = 1
        properties = {
          markdown = "### CloudFront CDN"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 29
        width  = 8
        height = 6
        properties = {
          title  = "CloudFront — Requests"
          view   = "timeSeries"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { stat = "Sum", period = 60 }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 29
        width  = 8
        height = 6
        properties = {
          title  = "CloudFront — Error Rates (%)"
          view   = "timeSeries"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { stat = "Average", period = 60, color = "#d62728" }],
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { stat = "Average", period = 60, color = "#ff7f0e" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 29
        width  = 8
        height = 6
        properties = {
          title  = "CloudFront — Cache Hit Rate (%)"
          view   = "timeSeries"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", var.cloudfront_distribution_id, "Region", "Global", { stat = "Average", period = 60 }]
          ]
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${local.name_prefix}-rds-cpu-high"
  alarm_description   = "RDS CPU utilisation exceeded threshold in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.rds_cpu_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage_low" {
  alarm_name          = "${local.name_prefix}-rds-free-storage-low"
  alarm_description   = "RDS free storage space is critically low in ${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_free_storage_alarm_bytes
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.critical_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${local.name_prefix}-rds-connections-high"
  alarm_description   = "RDS database connection count is too high in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.rds_connections_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_read_latency_high" {
  alarm_name          = "${local.name_prefix}-rds-read-latency-high"
  alarm_description   = "RDS read latency is too high in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.rds_latency_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  for_each = toset(var.ecs_service_names)

  alarm_name          = "${local.name_prefix}-ecs-${each.key}-cpu-high"
  alarm_description   = "ECS service ${each.key} CPU utilisation is too high in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = var.ecs_cpu_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.key
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    Service     = each.key
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  for_each = toset(var.ecs_service_names)

  alarm_name          = "${local.name_prefix}-ecs-${each.key}-memory-high"
  alarm_description   = "ECS service ${each.key} memory utilisation is too high in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = var.ecs_memory_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.key
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    Service     = each.key
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_group" "application_logs" {
  for_each = toset(var.ecs_service_names)

  name              = "/ecs/${var.project}/${var.environment}/${each.key}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn

  tags = {
    Name        = "/ecs/${var.project}/${var.environment}/${each.key}"
    Project     = var.project
    Environment = var.environment
    Service     = each.key
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_metric_filter" "application_errors" {
  for_each = toset(var.ecs_service_names)

  name           = "${local.name_prefix}-${each.key}-error-count"
  log_group_name = aws_cloudwatch_log_group.application_logs[each.key].name
  pattern        = "[timestamp, level = ERROR, ...]"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "${var.project}/${var.environment}/${each.key}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

resource "aws_cloudwatch_metric_alarm" "application_error_rate_high" {
  for_each = toset(var.ecs_service_names)

  alarm_name          = "${local.name_prefix}-${each.key}-error-rate-high"
  alarm_description   = "Application error rate is elevated for ${each.key} in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "${var.project}/${var.environment}/${each.key}"
  period              = 60
  statistic           = "Sum"
  threshold           = var.app_error_count_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  tags = {
    Project     = var.project
    Environment = var.environment
    Service     = each.key
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_metric_filter" "stripe_webhook_failures" {
  name           = "${local.name_prefix}-stripe-webhook-failures"
  log_group_name = aws_cloudwatch_log_group.application_logs["order-payment-service"].name
  pattern        = "[timestamp, level, msg = \"*stripe*webhook*fail*\", ...]"

  metric_transformation {
    name          = "StripeWebhookFailures"
    namespace     = "${var.project}/${var.environment}/payments"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }

  depends_on = [aws_cloudwatch_log_group.application_logs]
}

resource "aws_cloudwatch_metric_alarm" "stripe_webhook_failures" {
  alarm_name          = "${local.name_prefix}-stripe-webhook-failures"
  alarm_description   = "Stripe webhook processing failures detected in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "StripeWebhookFailures"
  namespace           = "${var.project}/${var.environment}/payments"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.critical_alerts.arn]

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_metric_filter" "failed_appointment_bookings" {
  name           = "${local.name_prefix}-appointment-booking-failures"
  log_group_name = aws_cloudwatch_log_group.application_logs["appointment-service"].name
  pattern        = "[timestamp, level = ERROR, msg = \"*booking*fail*\", ...]"

  metric_transformation {
    name          = "AppointmentBookingFailures"
    namespace     = "${var.project}/${var.environment}/appointments"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }

  depends_on = [aws_cloudwatch_log_group.application_logs]
}

resource "aws_cloudwatch_metric_alarm" "appointment_booking_failures" {
  alarm_name          = "${local.name_prefix}-appointment-booking-failures"
  alarm_description   = "Appointment booking failures detected in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AppointmentBookingFailures"
  namespace           = "${var.project}/${var.environment}/appointments"
  period              = 300
  statistic           = "Sum"
  threshold           = var.appointment_failure_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_metric_filter" "auth_failures" {
  name           = "${local.name_prefix}-auth-failures"
  log_group_name = aws_cloudwatch_log_group.application_logs["auth-service"].name
  pattern        = "[timestamp, level = ERROR, msg = \"*auth*fail*\" || msg = \"*login*fail*\" || msg = \"*invalid*credential*\", ...]"

  metric_transformation {
    name          = "AuthFailures"
    namespace     = "${var.project}/${var.environment}/auth"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }

  depends_on = [aws_cloudwatch_log_group.application_logs]
}

resource "aws_cloudwatch_metric_alarm" "auth_failures_high" {
  alarm_name          = "${local.name_prefix}-auth-failures-high"
  alarm_description   = "High authentication failure rate detected — possible brute force in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AuthFailures"
  namespace           = "${var.project}/${var.environment}/auth"
  period              = 300
  statistic           = "Sum"
  threshold           = var.auth_failure_alarm_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.critical_alerts.arn]

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_budgets_budget" "monthly_cost" {
  count = var.enable_budget_alarm ? 1 : 0

  name         = "${local.name_prefix}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.critical_alert_email_endpoints
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.critical_alert_email_endpoints
  }
}
