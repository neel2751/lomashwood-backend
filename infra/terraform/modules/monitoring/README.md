# Monitoring Module — Lomash Wood

Provisions the complete observability layer: dual SNS alert topics, a CloudWatch overview dashboard spanning all infrastructure tiers, infrastructure-level alarms (RDS, Redis, ECS, ALB, CloudFront), business-critical application alarms (Stripe webhooks, appointment bookings, auth brute-force), per-service CloudWatch log groups with structured error metric filters, and an optional AWS Budgets cost alarm.

## Resources Created

| Resource | Description |
|---|---|
| `aws_sns_topic` (alerts) | General alerts topic — warning-level issues |
| `aws_sns_topic` (critical_alerts) | Critical alerts topic — P1 incidents requiring immediate action |
| `aws_sns_topic_subscription` | Email + Lambda (Slack) subscriptions for both topics |
| `aws_cloudwatch_dashboard` | Full system overview dashboard across all tiers |
| `aws_cloudwatch_log_group` | Per-service structured log group (one per ECS service) |
| `aws_cloudwatch_log_metric_filter` | ERROR count, Stripe failures, booking failures, auth failures |
| `aws_cloudwatch_metric_alarm` (RDS) | CPU, free storage, connection count, read latency |
| `aws_cloudwatch_metric_alarm` (ECS) | CPU and memory per service |
| `aws_cloudwatch_metric_alarm` (App) | Error rate per service, Stripe webhooks, bookings, auth |
| `aws_budgets_budget` | Monthly cost budget with 80% actual + 100% forecasted alerts |

## Alarm Severity Map

| Alarm | Topic | Threshold |
|---|---|---|
| RDS CPU high | alerts | 80% |
| RDS free storage low | **critical_alerts** | < 5 GB |
| RDS connection count high | alerts | 100 |
| RDS read latency high | alerts | 20 ms |
| ECS CPU high (per service) | alerts | 80% |
| ECS memory high (per service) | alerts | 80% |
| App error rate high (per service) | alerts | 10 errors/min |
| Stripe webhook failures | **critical_alerts** | > 0 |
| Appointment booking failures | alerts | > 5 per 5 min |
| Auth failures (brute-force) | **critical_alerts** | > 50 per 5 min |

## Usage

### Full Production Setup

```hcl
module "monitoring" {
  source = "../../modules/monitoring"

  project     = "lomash-wood"
  environment = "production"
  aws_region  = "eu-west-1"
  kms_key_arn = module.secrets.kms_key_arn

  alert_email_endpoints = [
    "devops@lomashwood.co.uk",
    "backend@lomashwood.co.uk"
  ]

  critical_alert_email_endpoints = [
    "oncall@lomashwood.co.uk",
    "cto@lomashwood.co.uk"
  ]

  slack_webhook_lambda_arn = aws_lambda_function.slack_notifier.arn

  alb_arn_suffix             = module.alb.alb_arn_suffix
  rds_instance_identifier    = module.rds.instance_identifier
  redis_replication_group_id = module.redis.replication_group_id
  ecs_cluster_name           = module.ecs.cluster_name
  cloudfront_distribution_id = module.cloudfront.distribution_id

  ecs_service_names = [
    "api-gateway",
    "auth-service",
    "product-service",
    "order-payment-service",
    "appointment-service",
    "content-service",
    "customer-service",
    "notification-service",
    "analytics-service"
  ]

  log_retention_days = 30

  rds_cpu_alarm_threshold      = 80
  rds_free_storage_alarm_bytes = 5368709120
  rds_connections_alarm_threshold = 100
  rds_latency_alarm_threshold  = 0.02

  ecs_cpu_alarm_threshold    = 80
  ecs_memory_alarm_threshold = 80

  app_error_count_alarm_threshold        = 10
  appointment_failure_alarm_threshold    = 5
  auth_failure_alarm_threshold           = 50

  enable_budget_alarm      = true
  monthly_budget_limit_usd = "500"
}
```

### Passing SNS ARNs to Other Modules

The SNS topic ARNs produced by this module are designed to be passed directly into other infrastructure modules:

```hcl
module "alb" {
  source               = "../../modules/alb"
  sns_alarm_topic_arns = [module.monitoring.alerts_topic_arn]
}

module "rds" {
  source               = "../../modules/rds"
  sns_alarm_topic_arns = [module.monitoring.alerts_topic_arn]
}

module "redis" {
  source               = "../../modules/redis"
  sns_alarm_topic_arns = [module.monitoring.alerts_topic_arn]
}

module "cloudfront" {
  source               = "../../modules/cloudfront"
  sns_alarm_topic_arns = [module.monitoring.alerts_topic_arn]
}

module "secrets" {
  source               = "../../modules/secrets"
  sns_alarm_topic_arns = [module.monitoring.critical_alerts_topic_arn]
}
```

### Using Log Group Names in ECS Task Definitions

```hcl
log_configuration = {
  logDriver = "awslogs"
  options = {
    "awslogs-group"         = module.monitoring.application_log_group_names["auth-service"]
    "awslogs-region"        = var.aws_region
    "awslogs-stream-prefix" = "ecs"
  }
}
```

### Slack Lambda Integration

To forward SNS alerts to Slack, create a Lambda and pass its ARN:

```hcl
resource "aws_lambda_function" "slack_notifier" {
  function_name = "${var.project}-${var.environment}-slack-notifier"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_basic.arn
  filename      = "slack_notifier.zip"

  environment {
    variables = {
      SLACK_WEBHOOK_URL = var.slack_webhook_url
    }
  }
}

resource "aws_lambda_permission" "sns_alerts" {
  statement_id  = "AllowSNSAlerts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_notifier.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = module.monitoring.alerts_topic_arn
}

resource "aws_lambda_permission" "sns_critical" {
  statement_id  = "AllowSNSCritical"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.slack_notifier.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = module.monitoring.critical_alerts_topic_arn
}
```

## Dashboard Sections

The CloudWatch dashboard is structured into the following sections:

| Section | Widgets | Metrics |
|---|---|---|
| ALB | Request Count, 5xx Error Rate, p95 Latency | `RequestCount`, `HTTPCode_ELB_5XX_Count`, `TargetResponseTime` |
| RDS PostgreSQL | CPU Utilisation, Free Storage, DB Connections | `CPUUtilization`, `FreeStorageSpace`, `DatabaseConnections` |
| Redis | CPU Utilisation, Memory Usage, Cache Hit Rate | `EngineCPUUtilization`, `DatabaseMemoryUsagePercentage`, `CacheHitRate` |
| ECS Services | CPU Reservation, Memory Reservation | `CPUUtilization`, `MemoryUtilization` (all services) |
| CloudFront CDN | Requests, Error Rates, Cache Hit Rate | `Requests`, `5xxErrorRate`, `4xxErrorRate`, `CacheHitRate` |

## Business-Critical Metric Filters

In addition to infrastructure alarms, the following application-level metric filters are applied against structured JSON logs:

| Filter | Log Group | Pattern | Alarm Topic |
|---|---|---|---|
| `ErrorCount` | All services | `level = ERROR` | alerts |
| `StripeWebhookFailures` | order-payment-service | `stripe*webhook*fail` | **critical_alerts** |
| `AppointmentBookingFailures` | appointment-service | `booking*fail` | alerts |
| `AuthFailures` | auth-service | `auth*fail` / `login*fail` / `invalid*credential` | **critical_alerts** |

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name | `string` | `"lomash-wood"` | no |
| `environment` | Deployment environment | `string` | — | yes |
| `aws_region` | Primary AWS region | `string` | `"eu-west-1"` | no |
| `kms_key_arn` | KMS key for SNS + log group encryption | `string` | `null` | no |
| `alert_email_endpoints` | Email addresses for general alerts | `list(string)` | `[]` | no |
| `critical_alert_email_endpoints` | Email addresses for critical alerts | `list(string)` | `[]` | no |
| `slack_webhook_lambda_arn` | Lambda ARN for Slack forwarding | `string` | `null` | no |
| `alb_arn_suffix` | ALB ARN suffix for CloudWatch dimensions | `string` | — | yes |
| `rds_instance_identifier` | RDS instance identifier | `string` | — | yes |
| `redis_replication_group_id` | Redis replication group ID | `string` | — | yes |
| `ecs_cluster_name` | ECS cluster name | `string` | — | yes |
| `ecs_service_names` | List of ECS service names | `list(string)` | all 9 services | no |
| `cloudfront_distribution_id` | CloudFront distribution ID | `string` | `""` | no |
| `log_retention_days` | Log group retention in days | `number` | `30` | no |
| `rds_cpu_alarm_threshold` | RDS CPU alarm threshold (%) | `number` | `80` | no |
| `rds_free_storage_alarm_bytes` | RDS free storage alarm threshold (bytes) | `number` | `5368709120` | no |
| `rds_connections_alarm_threshold` | RDS connection count threshold | `number` | `100` | no |
| `rds_latency_alarm_threshold` | RDS read latency threshold (seconds) | `number` | `0.02` | no |
| `ecs_cpu_alarm_threshold` | ECS CPU alarm threshold (%) | `number` | `80` | no |
| `ecs_memory_alarm_threshold` | ECS memory alarm threshold (%) | `number` | `80` | no |
| `app_error_count_alarm_threshold` | App error count per minute threshold | `number` | `10` | no |
| `appointment_failure_alarm_threshold` | Booking failure count per 5 min threshold | `number` | `5` | no |
| `auth_failure_alarm_threshold` | Auth failure count per 5 min threshold | `number` | `50` | no |
| `enable_budget_alarm` | Enable AWS Budgets monthly cost alarm | `bool` | `false` | no |
| `monthly_budget_limit_usd` | Monthly budget limit in USD | `string` | `"500"` | no |

## Outputs

| Name | Description |
|---|---|
| `alerts_topic_arn` | General alerts SNS topic ARN |
| `alerts_topic_name` | General alerts SNS topic name |
| `critical_alerts_topic_arn` | Critical alerts SNS topic ARN |
| `critical_alerts_topic_name` | Critical alerts SNS topic name |
| `dashboard_name` | CloudWatch dashboard name |
| `dashboard_arn` | CloudWatch dashboard ARN |
| `application_log_group_names` | Map of service name → log group name |
| `application_log_group_arns` | Map of service name → log group ARN |
| `rds_cpu_alarm_arn` | RDS CPU alarm ARN |
| `rds_free_storage_alarm_arn` | RDS free storage alarm ARN |
| `rds_connections_alarm_arn` | RDS connections alarm ARN |
| `rds_read_latency_alarm_arn` | RDS read latency alarm ARN |
| `ecs_cpu_alarm_arns` | Map of service name → ECS CPU alarm ARN |
| `ecs_memory_alarm_arns` | Map of service name → ECS memory alarm ARN |
| `app_error_rate_alarm_arns` | Map of service name → error rate alarm ARN |
| `stripe_webhook_failure_alarm_arn` | Stripe webhook failure alarm ARN |
| `appointment_booking_failure_alarm_arn` | Appointment booking failure alarm ARN |
| `auth_failure_alarm_arn` | Auth failure (brute-force) alarm ARN |

## Notes

- This module should be instantiated **before** other modules that depend on `alerts_topic_arn` and `critical_alerts_topic_arn`
- CloudWatch metrics for CloudFront are only available in `us-east-1` — the dashboard uses `region = "us-east-1"` for those widgets explicitly
- `log_retention_days` must be an exact valid CloudWatch Logs retention value — a validation rule enforces this
- The RDS free storage alarm routes to `critical_alerts` (not `alerts`) as running out of storage causes immediate service outage
- The Stripe webhook failure alarm has a threshold of 0 — any failure is considered critical to prevent payment processing gaps in line with the SRS payment requirements
- Auth failure threshold of 50 per 5 minutes triggers critical alerts to detect brute-force attempts against the Better Auth service as required by SRS NFR2.1