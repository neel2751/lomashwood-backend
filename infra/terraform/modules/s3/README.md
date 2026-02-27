# S3 Module — Lomash Wood

Provisions a purpose-built AWS S3 bucket with encryption, versioning, CORS, lifecycle rules, access logging, event notifications, bucket policy, optional CloudFront OAI, and CloudWatch alarms.

## Resources Created

| Resource | Description |
|---|---|
| `aws_s3_bucket` | Primary S3 bucket |
| `aws_s3_bucket_versioning` | Versioning configuration |
| `aws_s3_bucket_server_side_encryption_configuration` | SSE-S3 or SSE-KMS encryption |
| `aws_s3_bucket_public_access_block` | Public access block settings |
| `aws_s3_bucket_ownership_controls` | Object ownership enforcement |
| `aws_s3_bucket_cors_configuration` | CORS rules (conditional) |
| `aws_s3_bucket_lifecycle_configuration` | Lifecycle transition/expiry rules (conditional) |
| `aws_s3_bucket_logging` | Access log delivery (conditional) |
| `aws_s3_bucket_notification` | SQS/SNS event notifications (conditional) |
| `aws_s3_bucket_policy` | Bucket policy with optional public read + TLS enforcement |
| `aws_cloudfront_origin_access_identity` | CloudFront OAI (conditional) |
| `aws_cloudwatch_metric_alarm` | Bucket size alarm (conditional) |

## Usage

### Media Uploads Bucket (CDN-backed)

```hcl
module "s3_media" {
  source = "../../modules/s3"

  project        = "lomash-wood"
  environment    = "production"
  bucket_suffix  = "media"
  bucket_purpose = "Product images, media wall assets, blog images"

  versioning_enabled   = true
  create_cloudfront_oai = true

  cors_allowed_origins = [
    "https://lomashwood.co.uk",
    "https://www.lomashwood.co.uk"
  ]

  lifecycle_rules = [
    {
      id      = "transition-to-ia"
      enabled = true
      transitions = [
        { days = 90, storage_class = "STANDARD_IA" }
      ]
      abort_incomplete_multipart_upload_days = 7
    }
  ]

  enable_size_alarm          = true
  size_alarm_threshold_bytes = 21474836480
  sns_alarm_topic_arns       = [aws_sns_topic.alerts.arn]
}
```

### Private Uploads Bucket (User Submissions)

```hcl
module "s3_uploads" {
  source = "../../modules/s3"

  project        = "lomash-wood"
  environment    = "production"
  bucket_suffix  = "uploads"
  bucket_purpose = "Temporary user upload staging (brochure, appointment assets)"

  versioning_enabled = false
  allow_public_read  = false
  kms_key_arn        = aws_kms_key.s3.arn

  cors_allowed_origins = ["https://lomashwood.co.uk"]
  cors_allowed_methods = ["PUT", "POST"]

  lifecycle_rules = [
    {
      id              = "expire-temp-uploads"
      enabled         = true
      prefix          = "temp/"
      expiration_days = 1
      abort_incomplete_multipart_upload_days = 1
    }
  ]

  sqs_notification_arn       = aws_sqs_queue.upload_events.arn
  notification_filter_prefix = "temp/"
}
```

### Access Logs Bucket

```hcl
module "s3_logs" {
  source = "../../modules/s3"

  project        = "lomash-wood"
  environment    = "production"
  bucket_suffix  = "access-logs"
  bucket_purpose = "S3 and ALB access logs"

  versioning_enabled = false
  allow_public_read  = false

  lifecycle_rules = [
    {
      id              = "expire-logs"
      enabled         = true
      expiration_days = 90
      abort_incomplete_multipart_upload_days = 1
    }
  ]
}
```

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name | `string` | `"lomash-wood"` | no |
| `environment` | Deployment environment | `string` | — | yes |
| `bucket_suffix` | Bucket name suffix (e.g. media, uploads, logs) | `string` | — | yes |
| `bucket_purpose` | Human-readable bucket purpose for tagging | `string` | `"general"` | no |
| `versioning_enabled` | Enable S3 versioning | `bool` | `false` | no |
| `kms_key_arn` | KMS key ARN for SSE-KMS (null = SSE-S3) | `string` | `null` | no |
| `allow_public_read` | Allow public unauthenticated reads | `bool` | `false` | no |
| `cors_allowed_origins` | CORS allowed origins | `list(string)` | `[]` | no |
| `cors_allowed_headers` | CORS allowed headers | `list(string)` | `["*"]` | no |
| `cors_allowed_methods` | CORS allowed methods | `list(string)` | `["GET","PUT","POST","DELETE","HEAD"]` | no |
| `cors_expose_headers` | CORS expose headers | `list(string)` | `["ETag"]` | no |
| `cors_max_age_seconds` | CORS preflight cache duration | `number` | `3600` | no |
| `lifecycle_rules` | List of lifecycle rule objects | `list(object)` | `[]` | no |
| `access_log_bucket_id` | Bucket ID for access log delivery | `string` | `null` | no |
| `sqs_notification_arn` | SQS ARN for event notifications | `string` | `null` | no |
| `sns_notification_arn` | SNS ARN for event notifications | `string` | `null` | no |
| `notification_events` | S3 event types to notify on | `list(string)` | `["s3:ObjectCreated:*"]` | no |
| `notification_filter_prefix` | Key prefix filter for notifications | `string` | `null` | no |
| `notification_filter_suffix` | Key suffix filter for notifications | `string` | `null` | no |
| `additional_policy_statements` | Extra IAM policy statements | `list(any)` | `[]` | no |
| `create_cloudfront_oai` | Create a CloudFront OAI for this bucket | `bool` | `false` | no |
| `enable_size_alarm` | Enable CloudWatch size alarm | `bool` | `false` | no |
| `size_alarm_threshold_bytes` | Byte threshold for size alarm | `number` | `10737418240` | no |
| `sns_alarm_topic_arns` | SNS topics for CloudWatch alarms | `list(string)` | `[]` | no |

## Outputs

| Name | Description |
|---|---|
| `bucket_id` | Bucket name / ID |
| `bucket_arn` | Bucket ARN |
| `bucket_domain_name` | Global bucket domain name |
| `bucket_regional_domain_name` | Regional bucket domain name |
| `bucket_region` | AWS region |
| `versioning_status` | Current versioning status |
| `cloudfront_oai_id` | CloudFront OAI ID (if created) |
| `cloudfront_oai_iam_arn` | CloudFront OAI IAM ARN (if created) |
| `cloudfront_oai_cloudfront_access_identity_path` | OAI path for CloudFront origin config (if created) |
| `size_alarm_arn` | CloudWatch size alarm ARN (if created) |

## Security Notes

- All buckets enforce TLS via a `DenyNonTLS` bucket policy statement
- Public access block is enabled by default; set `allow_public_read = true` only for CDN-origin buckets
- `allow_public_read` and `create_cloudfront_oai` are mutually exclusive — use OAI for CDN delivery instead of open public access
- Encryption is always enabled; pass `kms_key_arn` for stricter key management in production
- `force_destroy` is disabled in production to prevent accidental data loss