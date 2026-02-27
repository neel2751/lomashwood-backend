# ALB Module — Lomash Wood

Provisions an AWS Application Load Balancer with HTTPS enforcement, dynamic target groups, path and host-based listener routing rules, optional WAF association, access logging, and a full suite of CloudWatch alarms.

## Resources Created

| Resource | Description |
|---|---|
| `aws_lb` | Application Load Balancer (internet-facing or internal) |
| `aws_security_group` | ALB security group allowing HTTP/HTTPS ingress |
| `aws_lb_listener` (HTTP) | Port 80 listener — always redirects to HTTPS 301 |
| `aws_lb_listener` (HTTPS) | Port 443 listener with ACM certificate and default 404 response |
| `aws_lb_listener_certificate` | Additional SNI certificates for extra domains (conditional) |
| `aws_lb_target_group` | One target group per entry in `var.target_groups` |
| `aws_lb_listener_rule` | One routing rule per entry in `var.listener_rules` |
| `aws_wafv2_web_acl_association` | WAF WebACL association (conditional) |
| `aws_cloudwatch_metric_alarm` (ALB 5xx) | Alarm on ELB-level 5xx count |
| `aws_cloudwatch_metric_alarm` (ALB 4xx) | Alarm on ELB-level 4xx count |
| `aws_cloudwatch_metric_alarm` (Target 5xx) | Alarm on target-level 5xx count |
| `aws_cloudwatch_metric_alarm` (Latency) | Alarm on p95 target response time |
| `aws_cloudwatch_metric_alarm` (Unhealthy hosts) | Per-target-group unhealthy host count alarm |

## Usage

### Full Production Setup

```hcl
module "alb" {
  source = "../../modules/alb"

  project     = "lomash-wood"
  environment = "production"

  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  acm_certificate_arn    = aws_acm_certificate.main.arn
  extra_certificate_arns = [aws_acm_certificate.www.arn]
  ssl_policy             = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  access_log_bucket_id = module.s3_logs.bucket_id
  waf_web_acl_arn      = aws_wafv2_web_acl.main.arn

  target_groups = [
    {
      name                  = "api-gateway"
      port                  = 3000
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_interval = 30
      health_check_timeout  = 5
      health_check_matcher  = "200"
      healthy_threshold     = 3
      unhealthy_threshold   = 3
    },
    {
      name                  = "auth-service"
      port                  = 3001
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_matcher  = "200"
    },
    {
      name                  = "product-service"
      port                  = 3002
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_matcher  = "200"
    },
    {
      name                  = "order-payment-service"
      port                  = 3003
      target_type           = "ip"
      deregistration_delay  = 60
      health_check_path     = "/health"
      health_check_matcher  = "200"
    },
    {
      name                  = "appointment-service"
      port                  = 3004
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_matcher  = "200"
    },
    {
      name                  = "content-service"
      port                  = 3005
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_matcher  = "200"
    },
    {
      name                  = "customer-service"
      port                  = 3006
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_matcher  = "200"
    },
    {
      name                  = "notification-service"
      port                  = 3007
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_matcher  = "200"
    },
    {
      name                  = "analytics-service"
      port                  = 3008
      target_type           = "ip"
      deregistration_delay  = 30
      health_check_path     = "/health"
      health_check_matcher  = "200"
    }
  ]

  listener_rules = [
    {
      priority          = 10
      target_group_name = "api-gateway"
      path_patterns     = ["/v1/*"]
    },
    {
      priority          = 20
      target_group_name = "auth-service"
      path_patterns     = ["/v1/auth/*"]
    },
    {
      priority          = 30
      target_group_name = "product-service"
      path_patterns     = ["/v1/products/*", "/v1/categories/*"]
    },
    {
      priority          = 40
      target_group_name = "order-payment-service"
      path_patterns     = ["/v1/orders/*", "/v1/payments/*", "/v1/webhooks/*"]
    },
    {
      priority          = 50
      target_group_name = "appointment-service"
      path_patterns     = ["/v1/appointments/*", "/v1/showrooms/*"]
    },
    {
      priority          = 60
      target_group_name = "content-service"
      path_patterns     = ["/v1/blog/*", "/v1/media/*", "/v1/brochures/*"]
    },
    {
      priority          = 70
      target_group_name = "customer-service"
      path_patterns     = ["/v1/customers/*", "/v1/reviews/*"]
    },
    {
      priority          = 80
      target_group_name = "notification-service"
      path_patterns     = ["/v1/notifications/*"]
    },
    {
      priority          = 90
      target_group_name = "analytics-service"
      path_patterns     = ["/v1/analytics/*"]
    }
  ]

  alarm_5xx_threshold             = 10
  alarm_4xx_threshold             = 100
  alarm_latency_threshold_seconds = 3
  sns_alarm_topic_arns            = [aws_sns_topic.alerts.arn]
}
```

### Wiring ALB to ECS Services

After creating the ALB, pass target group ARNs to the ECS module:

```hcl
module "ecs_api_gateway" {
  source = "../../modules/ecs"

  target_group_arn = module.alb.target_group_arns["api-gateway"]
  container_port   = 3000
}
```

### Route 53 Alias Record

```hcl
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.lomashwood.co.uk"
  type    = "A"

  alias {
    name                   = module.alb.alb_dns_name
    zone_id                = module.alb.alb_zone_id
    evaluate_target_health = true
  }
}
```

## Listener Rule Priority Map

| Priority | Service | Path Patterns |
|---|---|---|
| 10 | api-gateway | `/v1/*` |
| 20 | auth-service | `/v1/auth/*` |
| 30 | product-service | `/v1/products/*`, `/v1/categories/*` |
| 40 | order-payment-service | `/v1/orders/*`, `/v1/payments/*`, `/v1/webhooks/*` |
| 50 | appointment-service | `/v1/appointments/*`, `/v1/showrooms/*` |
| 60 | content-service | `/v1/blog/*`, `/v1/media/*`, `/v1/brochures/*` |
| 70 | customer-service | `/v1/customers/*`, `/v1/reviews/*` |
| 80 | notification-service | `/v1/notifications/*` |
| 90 | analytics-service | `/v1/analytics/*` |

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name | `string` | `"lomash-wood"` | no |
| `environment` | Deployment environment | `string` | — | yes |
| `vpc_id` | VPC ID | `string` | — | yes |
| `public_subnet_ids` | Public subnet IDs (internet-facing ALB) | `list(string)` | `[]` | no |
| `private_subnet_ids` | Private subnet IDs (internal ALB) | `list(string)` | `[]` | no |
| `internal` | Create an internal ALB | `bool` | `false` | no |
| `ingress_cidr_blocks` | CIDRs allowed on ports 80/443 | `list(string)` | `["0.0.0.0/0"]` | no |
| `idle_timeout` | Connection idle timeout (seconds) | `number` | `60` | no |
| `acm_certificate_arn` | Primary ACM certificate ARN | `string` | — | yes |
| `extra_certificate_arns` | Extra SNI certificate ARNs | `list(string)` | `[]` | no |
| `ssl_policy` | HTTPS listener SSL policy | `string` | `"ELBSecurityPolicy-TLS13-1-2-2021-06"` | no |
| `access_log_bucket_id` | S3 bucket for ALB access logs | `string` | `""` | no |
| `target_groups` | Target group definitions | `list(object)` | `[]` | no |
| `listener_rules` | HTTPS listener routing rules | `list(object)` | `[]` | no |
| `waf_web_acl_arn` | WAFv2 WebACL ARN to associate | `string` | `null` | no |
| `sns_alarm_topic_arns` | SNS topics for CloudWatch alarms | `list(string)` | `[]` | no |
| `alarm_5xx_threshold` | 5xx count alarm threshold per minute | `number` | `10` | no |
| `alarm_4xx_threshold` | 4xx count alarm threshold per minute | `number` | `100` | no |
| `alarm_latency_threshold_seconds` | p95 latency alarm threshold (seconds) | `number` | `3` | no |

### Target Group Object Fields

| Field | Description | Default |
|---|---|---|
| `name` | Short name used in resource naming | — |
| `port` | Container port | — |
| `target_type` | `ip` or `instance` | `"ip"` |
| `deregistration_delay` | Draining delay in seconds | `30` |
| `stickiness_enabled` | Enable lb_cookie stickiness | `false` |
| `health_check_path` | Health check endpoint | `"/health"` |
| `health_check_timeout` | Health check timeout (seconds) | `5` |
| `health_check_interval` | Health check interval (seconds) | `30` |
| `health_check_matcher` | Expected HTTP status code | `"200"` |
| `healthy_threshold` | Consecutive successes for healthy | `3` |
| `unhealthy_threshold` | Consecutive failures for unhealthy | `3` |

## Outputs

| Name | Description |
|---|---|
| `alb_id` | ALB ID |
| `alb_arn` | ALB ARN |
| `alb_arn_suffix` | ALB ARN suffix for CloudWatch dimensions |
| `alb_dns_name` | ALB DNS name for Route 53 alias |
| `alb_zone_id` | ALB canonical hosted zone ID |
| `security_group_id` | ALB security group ID |
| `http_listener_arn` | HTTP listener ARN |
| `https_listener_arn` | HTTPS listener ARN |
| `target_group_arns` | Map of name → ARN for all target groups |
| `target_group_arn_suffixes` | Map of name → ARN suffix for CloudWatch |
| `target_group_names` | Map of name key → full AWS name |
| `alb_5xx_alarm_arn` | ALB 5xx alarm ARN |
| `alb_4xx_alarm_arn` | ALB 4xx alarm ARN |
| `alb_target_5xx_alarm_arn` | Target 5xx alarm ARN |
| `alb_latency_alarm_arn` | p95 latency alarm ARN |
| `unhealthy_host_alarm_arns` | Map of target group name → unhealthy host alarm ARN |

## Security Notes

- HTTP port 80 always performs a 301 redirect to HTTPS — no plaintext traffic is ever forwarded to services
- `drop_invalid_header_fields = true` is enforced on the ALB to prevent HTTP desync attacks
- `enable_deletion_protection` is automatically set to `true` in production
- The default SSL policy `ELBSecurityPolicy-TLS13-1-2-2021-06` enforces TLS 1.2+ and prioritises TLS 1.3
- Associate a WAFv2 WebACL via `waf_web_acl_arn` in production to protect against OWASP Top 10 threats
- The default HTTPS action returns a structured JSON 404 — no upstream service details are leaked
- The p95 latency alarm threshold of 3 seconds aligns with the SRS NFR1.1 performance requirement