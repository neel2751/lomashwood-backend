locals {
  s3_origin_id  = "${var.project}-${var.environment}-s3-origin"
  alb_origin_id = "${var.project}-${var.environment}-alb-origin"
}

resource "aws_cloudfront_origin_access_control" "s3" {
  count = var.s3_bucket_regional_domain_name != null ? 1 : 0

  name                              = "${var.project}-${var.environment}-s3-oac"
  description                       = "OAC for ${var.project} ${var.environment} S3 media bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "static_assets" {
  name        = "${var.project}-${var.environment}-static-assets"
  comment     = "Cache policy for static assets (images, CSS, JS)"
  default_ttl = var.static_assets_default_ttl
  max_ttl     = var.static_assets_max_ttl
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_cache_policy" "api" {
  name        = "${var.project}-${var.environment}-api"
  comment     = "Cache policy for API responses — no caching by default"
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = false
    enable_accept_encoding_gzip   = false

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "all"
    }
  }
}

resource "aws_cloudfront_origin_request_policy" "api" {
  name    = "${var.project}-${var.environment}-api-origin-request"
  comment = "Forward all headers, cookies, and query strings to ALB origin"

  cookies_config {
    cookie_behavior = "all"
  }

  headers_config {
    header_behavior = "allViewer"
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.project}-${var.environment}-security-headers"
  comment = "Security response headers policy for ${var.project} ${var.environment}"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    content_security_policy {
      content_security_policy = var.content_security_policy
      override                = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      value    = "geolocation=(), microphone=(), camera=()"
      override = true
    }

    items {
      header   = "X-Content-Type-Options"
      value    = "nosniff"
      override = true
    }
  }
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project} ${var.environment} CDN distribution"
  default_root_object = var.default_root_object
  price_class         = var.price_class
  aliases             = var.domain_aliases
  web_acl_id          = var.waf_web_acl_arn
  http_version        = "http2and3"
  wait_for_deployment = false

  dynamic "origin" {
    for_each = var.s3_bucket_regional_domain_name != null ? [1] : []
    content {
      domain_name              = var.s3_bucket_regional_domain_name
      origin_id                = local.s3_origin_id
      origin_access_control_id = aws_cloudfront_origin_access_control.s3[0].id

      origin_shield {
        enabled              = var.origin_shield_enabled
        origin_shield_region = var.origin_shield_region
      }
    }
  }

  dynamic "origin" {
    for_each = var.alb_dns_name != null ? [1] : []
    content {
      domain_name = var.alb_dns_name
      origin_id   = local.alb_origin_id

      custom_origin_config {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
        origin_read_timeout    = var.origin_read_timeout
        origin_keepalive_timeout = var.origin_keepalive_timeout
      }

      custom_header {
        name  = "X-CloudFront-Secret"
        value = var.cloudfront_origin_secret
      }

      origin_shield {
        enabled              = var.origin_shield_enabled
        origin_shield_region = var.origin_shield_region
      }
    }
  }

  default_cache_behavior {
    allowed_methods            = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods             = ["GET", "HEAD", "OPTIONS"]
    target_origin_id           = var.alb_dns_name != null ? local.alb_origin_id : local.s3_origin_id
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.api.id
    origin_request_policy_id   = aws_cloudfront_origin_request_policy.api.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  dynamic "ordered_cache_behavior" {
    for_each = var.s3_bucket_regional_domain_name != null ? [1] : []
    content {
      path_pattern               = "/media/*"
      allowed_methods            = ["GET", "HEAD", "OPTIONS"]
      cached_methods             = ["GET", "HEAD", "OPTIONS"]
      target_origin_id           = local.s3_origin_id
      viewer_protocol_policy     = "redirect-to-https"
      compress                   = true
      cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
      response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    }
  }

  dynamic "ordered_cache_behavior" {
    for_each = var.s3_bucket_regional_domain_name != null ? [1] : []
    content {
      path_pattern               = "/uploads/*"
      allowed_methods            = ["GET", "HEAD", "OPTIONS"]
      cached_methods             = ["GET", "HEAD", "OPTIONS"]
      target_origin_id           = local.s3_origin_id
      viewer_protocol_policy     = "redirect-to-https"
      compress                   = true
      cache_policy_id            = aws_cloudfront_cache_policy.static_assets.id
      response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    }
  }

  dynamic "ordered_cache_behavior" {
    for_each = var.additional_cache_behaviors
    content {
      path_pattern               = ordered_cache_behavior.value.path_pattern
      allowed_methods            = ordered_cache_behavior.value.allowed_methods
      cached_methods             = ordered_cache_behavior.value.cached_methods
      target_origin_id           = ordered_cache_behavior.value.target_origin_id
      viewer_protocol_policy     = "redirect-to-https"
      compress                   = true
      cache_policy_id            = ordered_cache_behavior.value.cache_policy_id != null ? ordered_cache_behavior.value.cache_policy_id : aws_cloudfront_cache_policy.api.id
      response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  viewer_certificate {
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
    cloudfront_default_certificate = var.acm_certificate_arn == null ? true : false
  }

  dynamic "custom_error_response" {
    for_each = var.custom_error_responses
    content {
      error_code            = custom_error_response.value.error_code
      response_code         = custom_error_response.value.response_code
      response_page_path    = custom_error_response.value.response_page_path
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
    }
  }

  logging_config {
    bucket          = var.log_bucket_domain_name
    prefix          = "cloudfront/${var.project}-${var.environment}/"
    include_cookies = false
  }

  tags = {
    Name        = "${var.project}-${var.environment}-cdn"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "cdn_5xx_rate" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-cdn-5xx-rate-high"
  alarm_description   = "CloudFront 5xx error rate exceeded threshold in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 60
  statistic           = "Average"
  threshold           = var.alarm_5xx_rate_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
    Region         = "Global"
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "cdn_4xx_rate" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-cdn-4xx-rate-high"
  alarm_description   = "CloudFront 4xx error rate exceeded threshold in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 60
  statistic           = "Average"
  threshold           = var.alarm_4xx_rate_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
    Region         = "Global"
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "cdn_total_error_rate" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-cdn-total-error-rate-high"
  alarm_description   = "CloudFront total error rate exceeded threshold in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TotalErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 60
  statistic           = "Average"
  threshold           = var.alarm_total_error_rate_threshold
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
    Region         = "Global"
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "cdn_origin_latency" {
  count = length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-cdn-origin-latency-high"
  alarm_description   = "CloudFront origin latency exceeded threshold in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "OriginLatency"
  namespace           = "AWS/CloudFront"
  period              = 60
  extended_statistic  = "p95"
  threshold           = var.alarm_origin_latency_ms
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns
  ok_actions          = var.sns_alarm_topic_arns

  dimensions = {
    DistributionId = aws_cloudfront_distribution.main.id
    Region         = "Global"
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
