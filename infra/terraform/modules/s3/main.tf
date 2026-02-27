resource "aws_s3_bucket" "main" {
  bucket        = "${var.project}-${var.environment}-${var.bucket_suffix}"
  force_destroy = var.environment != "production"

  tags = {
    Name        = "${var.project}-${var.environment}-${var.bucket_suffix}"
    Project     = var.project
    Environment = var.environment
    Purpose     = var.bucket_purpose
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = var.kms_key_arn != null ? "aws:kms" : "AES256"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = var.kms_key_arn != null ? true : false
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = !var.allow_public_read
  block_public_policy     = !var.allow_public_read
  ignore_public_acls      = !var.allow_public_read
  restrict_public_buckets = !var.allow_public_read
}

resource "aws_s3_bucket_ownership_controls" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    object_ownership = var.allow_public_read ? "BucketOwnerPreferred" : "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_cors_configuration" "main" {
  count  = length(var.cors_allowed_origins) > 0 ? 1 : 0
  bucket = aws_s3_bucket.main.id

  cors_rule {
    allowed_headers = var.cors_allowed_headers
    allowed_methods = var.cors_allowed_methods
    allowed_origins = var.cors_allowed_origins
    expose_headers  = var.cors_expose_headers
    max_age_seconds = var.cors_max_age_seconds
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "main" {
  count  = length(var.lifecycle_rules) > 0 ? 1 : 0
  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      dynamic "filter" {
        for_each = rule.value.prefix != null ? [rule.value.prefix] : []
        content {
          prefix = filter.value
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [rule.value.expiration_days] : []
        content {
          days = expiration.value
        }
      }

      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration_days != null ? [rule.value.noncurrent_version_expiration_days] : []
        content {
          noncurrent_days = noncurrent_version_expiration.value
        }
      }

      dynamic "transition" {
        for_each = rule.value.transitions != null ? rule.value.transitions : []
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "abort_incomplete_multipart_upload" {
        for_each = rule.value.abort_incomplete_multipart_upload_days != null ? [rule.value.abort_incomplete_multipart_upload_days] : []
        content {
          days_after_initiation = abort_incomplete_multipart_upload.value
        }
      }
    }
  }
}

resource "aws_s3_bucket_logging" "main" {
  count = var.access_log_bucket_id != null ? 1 : 0

  bucket        = aws_s3_bucket.main.id
  target_bucket = var.access_log_bucket_id
  target_prefix = "s3-access-logs/${aws_s3_bucket.main.id}/"
}

resource "aws_s3_bucket_notification" "main" {
  count  = var.sqs_notification_arn != null || var.sns_notification_arn != null ? 1 : 0
  bucket = aws_s3_bucket.main.id

  dynamic "queue" {
    for_each = var.sqs_notification_arn != null ? [var.sqs_notification_arn] : []
    content {
      queue_arn     = queue.value
      events        = var.notification_events
      filter_prefix = var.notification_filter_prefix
      filter_suffix = var.notification_filter_suffix
    }
  }

  dynamic "topic" {
    for_each = var.sns_notification_arn != null ? [var.sns_notification_arn] : []
    content {
      topic_arn     = topic.value
      events        = var.notification_events
      filter_prefix = var.notification_filter_prefix
      filter_suffix = var.notification_filter_suffix
    }
  }
}

resource "aws_s3_bucket_policy" "main" {
  count  = var.allow_public_read || length(var.additional_policy_statements) > 0 ? 1 : 0
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      var.allow_public_read ? [
        {
          Sid       = "AllowPublicRead"
          Effect    = "Allow"
          Principal = "*"
          Action    = ["s3:GetObject"]
          Resource  = ["${aws_s3_bucket.main.arn}/*"]
        }
      ] : [],
      [
        {
          Sid    = "DenyNonTLS"
          Effect = "Deny"
          Principal = {
            AWS = "*"
          }
          Action   = "s3:*"
          Resource = [aws_s3_bucket.main.arn, "${aws_s3_bucket.main.arn}/*"]
          Condition = {
            Bool = {
              "aws:SecureTransport" = "false"
            }
          }
        }
      ],
      var.additional_policy_statements
    )
  })

  depends_on = [aws_s3_bucket_public_access_block.main]
}

resource "aws_cloudfront_origin_access_identity" "main" {
  count   = var.create_cloudfront_oai ? 1 : 0
  comment = "OAI for ${var.project}-${var.environment}-${var.bucket_suffix}"
}

resource "aws_s3_bucket_policy" "cloudfront_oai" {
  count  = var.create_cloudfront_oai ? 1 : 0
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main[0].iam_arn
        }
        Action   = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.main.arn}/*"]
      },
      {
        Sid    = "DenyNonTLS"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:*"
        Resource = [aws_s3_bucket.main.arn, "${aws_s3_bucket.main.arn}/*"]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.main]
}

resource "aws_cloudwatch_metric_alarm" "bucket_size" {
  count               = var.enable_size_alarm && length(var.sns_alarm_topic_arns) > 0 ? 1 : 0
  alarm_name          = "${var.project}-${var.environment}-${var.bucket_suffix}-size-high"
  alarm_description   = "S3 bucket ${var.bucket_suffix} size exceeded threshold"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = 86400
  statistic           = "Average"
  threshold           = var.size_alarm_threshold_bytes
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns

  dimensions = {
    BucketName  = aws_s3_bucket.main.id
    StorageType = "StandardStorage"
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
