# CloudFront Module — Lomash Wood

Provisions an AWS CloudFront distribution with dual S3 + ALB origins, managed cache and origin request policies, a strict security response headers policy (CSP, HSTS, X-Frame-Options), custom error responses, Origin Access Control, optional WAF association, Origin Shield, and a full set of CloudWatch alarms.

## Resources Created

| Resource | Description |
|---|---|
| `aws_cloudfront_distribution` | Primary CDN distribution |
| `aws_cloudfront_origin_access_control` | S3 OAC with SigV4 signing (conditional) |
| `aws_cloudfront_cache_policy` (static) | Long-TTL cache policy for media/images/fonts |
| `aws_cloudfront_cache_policy` (api) | Zero-TTL pass-through policy for API traffic |
| `aws_cloudfront_origin_request_policy` | Forwards all headers, cookies, and query strings to ALB |
| `aws_cloudfront_response_headers_policy` | HSTS, CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy |
| `aws_cloudwatch_metric_alarm` (x4) | 5xx rate, 4xx rate, total error rate, p95 origin latency |

## Architecture Overview

```
Browser / Client
      │
      ▼
CloudFront Distribution (HTTP/2 + HTTP/3)
      │
      ├── /media/*  ──────────────► S3 Media Bucket (OAC SigV4)
      ├── /uploads/* ─────────────► S3 Media Bucket (OAC SigV4)
      │
      └── /* (default) ───────────► ALB → ECS Services
                                      (X-CloudFront-Secret header)
```

## Cache Behaviour Routing

| Path Pattern | Origin | Cache Policy | TTL |
|---|---|---|---|
| `/media/*` | S3 bucket | static-assets | 1 day default / 1 year max |
| `/uploads/*` | S3 bucket | static-assets | 1 day default / 1 year max |
| `/*` (default) | ALB | api (no-cache) | 0 |

## Usage

### Full Production Setup

```hcl
module "cloudfront" {
  source = "../../modules/cloudfront"

  project     = "lomash-wood"
  environment = "production"

  domain_aliases      = ["lomashwood.co.uk", "www.lomashwood.co.uk"]
  acm_certificate_arn = aws_acm_certificate.us_east_1.arn

  s3_bucket_regional_domain_name = module.s3_media.bucket_regional_domain_name
  alb_dns_name                   = module.alb.alb_dns_name
  cloudfront_origin_secret       = var.cloudfront_origin_secret

  price_class            = "PriceClass_100"
  origin_shield_enabled  = true
  origin_shield_region   = "eu-west-1"
  origin_read_timeout    = 30
  origin_keepalive_timeout = 5

  static_assets_default_ttl = 86400
  static_assets_max_ttl     = 31536000

  content_security_policy = "default-src 'self'; img-src 'self' data: https://lomashwood.co.uk https://*.cloudfront.net; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://api.lomashwood.co.uk; frame-ancestors 'none';"

  waf_web_acl_arn      = aws_wafv2_web_acl.cdn.arn
  log_bucket_domain_name = module.s3_logs.bucket_domain_name

  custom_error_responses = [
    {
      error_code            = 403
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 10
    },
    {
      error_code            = 404
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 10
    }
  ]

  alarm_5xx_rate_threshold         = 5
  alarm_4xx_rate_threshold         = 10
  alarm_total_error_rate_threshold = 10
  alarm_origin_latency_ms          = 3000
  sns_alarm_topic_arns             = [aws_sns_topic.alerts.arn]
}
```

### Route 53 Alias Records

```hcl
resource "aws_route53_record" "apex" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "lomashwood.co.uk"
  type    = "A"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.lomashwood.co.uk"
  type    = "A"

  alias {
    name                   = module.cloudfront.distribution_domain_name
    zone_id                = module.cloudfront.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}
```

### Granting CloudFront OAC Access to S3

After creating the distribution, update the S3 bucket policy to allow the OAC:

```hcl
data "aws_iam_policy_document" "s3_cloudfront_oac" {
  statement {
    sid    = "AllowCloudFrontOAC"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${module.s3_media.bucket_arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.cloudfront.distribution_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "media_oac" {
  bucket = module.s3_media.bucket_id
  policy = data.aws_iam_policy_document.s3_cloudfront_oac.json
}
```

### ALB Secret Header Validation

Configure the ALB to reject requests that do not carry the CloudFront secret header. Add this listener rule at priority 1:

```hcl
resource "aws_lb_listener_rule" "reject_non_cloudfront" {
  listener_arn = module.alb.https_listener_arn
  priority     = 1

  action {
    type = "fixed-response"
    fixed_response {
      content_type = "application/json"
      message_body = jsonencode({ error = "Forbidden" })
      status_code  = "403"
    }
  }

  condition {
    http_header {
      http_header_name = "X-CloudFront-Secret"
      values           = ["*"]
    }
  }
}
```

### Invalidating the Cache (CI/CD)

```bash
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw distribution_id) \
  --paths "/media/*" "/uploads/*"
```

## Security Headers Applied

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Configurable via `var.content_security_policy` |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` |

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name | `string` | `"lomash-wood"` | no |
| `environment` | Deployment environment | `string` | — | yes |
| `domain_aliases` | Custom domain CNAMEs | `list(string)` | `[]` | no |
| `acm_certificate_arn` | ACM cert ARN (must be in us-east-1) | `string` | `null` | no |
| `default_root_object` | Root object for `/` requests | `string` | `""` | no |
| `price_class` | CloudFront price class | `string` | `"PriceClass_100"` | no |
| `s3_bucket_regional_domain_name` | S3 origin regional domain | `string` | `null` | no |
| `alb_dns_name` | ALB origin DNS name | `string` | `null` | no |
| `cloudfront_origin_secret` | Secret header value sent to ALB | `string` | `""` | no |
| `origin_shield_enabled` | Enable Origin Shield | `bool` | `false` | no |
| `origin_shield_region` | Origin Shield AWS region | `string` | `"eu-west-1"` | no |
| `origin_read_timeout` | ALB origin read timeout (seconds) | `number` | `30` | no |
| `origin_keepalive_timeout` | ALB keepalive timeout (seconds) | `number` | `5` | no |
| `static_assets_default_ttl` | Default TTL for static assets (seconds) | `number` | `86400` | no |
| `static_assets_max_ttl` | Max TTL for static assets (seconds) | `number` | `31536000` | no |
| `content_security_policy` | CSP header value | `string` | see variables.tf | no |
| `geo_restriction_type` | none / whitelist / blacklist | `string` | `"none"` | no |
| `geo_restriction_locations` | Country codes for geo restriction | `list(string)` | `[]` | no |
| `custom_error_responses` | Custom error response configs | `list(object)` | 403→200, 404→200 | no |
| `additional_cache_behaviors` | Extra ordered cache behaviours | `list(object)` | `[]` | no |
| `waf_web_acl_arn` | WAFv2 WebACL ARN (us-east-1) | `string` | `null` | no |
| `log_bucket_domain_name` | S3 log bucket domain name | `string` | — | yes |
| `sns_alarm_topic_arns` | SNS topics for CloudWatch alarms | `list(string)` | `[]` | no |
| `alarm_5xx_rate_threshold` | 5xx rate alarm threshold (%) | `number` | `5` | no |
| `alarm_4xx_rate_threshold` | 4xx rate alarm threshold (%) | `number` | `10` | no |
| `alarm_total_error_rate_threshold` | Total error rate alarm threshold (%) | `number` | `10` | no |
| `alarm_origin_latency_ms` | p95 origin latency alarm threshold (ms) | `number` | `3000` | no |

## Outputs

| Name | Description |
|---|---|
| `distribution_id` | CloudFront distribution ID |
| `distribution_arn` | CloudFront distribution ARN |
| `distribution_domain_name` | CloudFront domain name for DNS alias |
| `distribution_hosted_zone_id` | Hosted zone ID for Route 53 alias (Z2FDTNDATAQYW2) |
| `distribution_etag` | Distribution ETag |
| `distribution_status` | Deployment status |
| `s3_origin_access_control_id` | S3 OAC ID (null if not created) |
| `static_assets_cache_policy_id` | Static assets cache policy ID |
| `api_cache_policy_id` | API no-cache policy ID |
| `api_origin_request_policy_id` | API origin request policy ID |
| `security_headers_policy_id` | Security response headers policy ID |
| `cdn_5xx_alarm_arn` | 5xx rate alarm ARN |
| `cdn_4xx_alarm_arn` | 4xx rate alarm ARN |
| `cdn_total_error_alarm_arn` | Total error rate alarm ARN |
| `cdn_origin_latency_alarm_arn` | p95 origin latency alarm ARN |

## Important Notes

- The ACM certificate (`acm_certificate_arn`) **must be in `us-east-1`** regardless of your stack's primary region — this is a CloudFront requirement
- WAF WebACLs attached to CloudFront **must also be created in `us-east-1`**
- `wait_for_deployment = false` is set to prevent Terraform from blocking on the 10–15 minute distribution deployment; check status with `distribution_status` output
- The `X-CloudFront-Secret` custom header prevents direct ALB access — ensure the ALB rejects requests without this header
- Origin Shield region should be set to the AWS region closest to your ECS cluster (e.g. `eu-west-1` for Ireland) to minimise origin fetch latency
- The p95 origin latency alarm threshold of 3000ms aligns with the SRS NFR1.1 requirement of sub-3-second page loads