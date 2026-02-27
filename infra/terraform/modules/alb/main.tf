resource "aws_security_group" "alb" {
  name        = "${var.project}-${var.environment}-alb-sg"
  description = "Security group for the ${var.project} ${var.environment} Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.ingress_cidr_blocks
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.ingress_cidr_blocks
  }

  egress {
    description = "All outbound to VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-${var.environment}-alb-sg"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_lb" "main" {
  name                       = "${var.project}-${var.environment}-alb"
  internal                   = var.internal
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb.id]
  subnets                    = var.internal ? var.private_subnet_ids : var.public_subnet_ids
  enable_deletion_protection = var.environment == "production"
  enable_http2               = true
  idle_timeout               = var.idle_timeout
  drop_invalid_header_fields = true

  access_logs {
    bucket  = var.access_log_bucket_id
    prefix  = "alb/${var.project}-${var.environment}"
    enabled = var.access_log_bucket_id != null && var.access_log_bucket_id != ""
  }

  tags = {
    Name        = "${var.project}-${var.environment}-alb"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-http-listener"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "application/json"
      message_body = jsonencode({ error = "Not Found", statusCode = 404 })
      status_code  = "404"
    }
  }

  tags = {
    Name        = "${var.project}-${var.environment}-https-listener"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_lb_listener_certificate" "extra" {
  for_each = toset(var.extra_certificate_arns)

  listener_arn    = aws_lb_listener.https.arn
  certificate_arn = each.value
}

resource "aws_lb_target_group" "services" {
  for_each = { for tg in var.target_groups : tg.name => tg }

  name                 = "${var.project}-${var.environment}-${each.value.name}"
  port                 = each.value.port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = each.value.target_type
  deregistration_delay = each.value.deregistration_delay

  health_check {
    enabled             = true
    path                = each.value.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = each.value.healthy_threshold
    unhealthy_threshold = each.value.unhealthy_threshold
    timeout             = each.value.health_check_timeout
    interval            = each.value.health_check_interval
    matcher             = each.value.health_check_matcher
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = each.value.stickiness_enabled
  }

  tags = {
    Name        = "${var.project}-${var.environment}-${each.value.name}"
    Project     = var.project
    Environment = var.environment
    Service     = each.value.name
    ManagedBy   = "terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_listener_rule" "services" {
  for_each = { for r in var.listener_rules : r.priority => r }

  listener_arn = aws_lb_listener.https.arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.value.target_group_name].arn
  }

  dynamic "condition" {
    for_each = each.value.path_patterns != null ? [each.value.path_patterns] : []
    content {
      path_pattern {
        values = condition.value
      }
    }
  }

  dynamic "condition" {
    for_each = each.value.host_headers != null ? [each.value.host_headers] : []
    content {
      host_header {
        values = condition.value
      }
    }
  }

  dynamic "condition" {
    for_each = each.value.http_headers != null ? each.value.http_headers : []
    content {
      http_header {
        http_header_name = condition.value.name
        values           = condition.value.values
      }
    }
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  count = var.waf_web_acl_arn != null ? 1 : 0

  resource_arn = aws_lb.main.arn
  web_acl_arn  = var.waf_web_acl_arn
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-alb-5xx-high"
  alarm_description   = "ALB 5xx error rate is elevated in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = var.alarm_5xx_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_4xx" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-alb-4xx-high"
  alarm_description   = "ALB 4xx error rate is elevated in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_4XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = var.alarm_4xx_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_target_5xx" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-alb-target-5xx-high"
  alarm_description   = "ALB target 5xx error rate is elevated in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = var.alarm_5xx_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-alb-latency-high"
  alarm_description   = "ALB target response time is elevated in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p95"
  threshold           = var.alarm_latency_threshold_seconds
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  for_each = {
    for tg in var.target_groups : tg.name => tg
    if length(var.sns_alarm_topic_arns) > 0
  }

  alarm_name          = "${var.project}-${var.environment}-${each.key}-unhealthy-hosts"
  alarm_description   = "Unhealthy hosts detected in target group ${each.key} in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.services[each.key].arn_suffix
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
