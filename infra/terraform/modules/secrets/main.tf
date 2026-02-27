resource "aws_secretsmanager_secret" "secrets" {
  for_each = { for s in var.secrets : s.name => s }

  name                    = "${var.project}/${var.environment}/${each.value.name}"
  description             = each.value.description
  kms_key_id              = var.kms_key_arn
  recovery_window_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name        = "${var.project}/${var.environment}/${each.value.name}"
    Project     = var.project
    Environment = var.environment
    SecretGroup = each.value.group
    ManagedBy   = "terraform"
  }
}

resource "aws_secretsmanager_secret_version" "secrets" {
  for_each = {
    for s in var.secrets : s.name => s
    if s.initial_value != null
  }

  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = each.value.initial_value

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret_rotation" "secrets" {
  for_each = {
    for s in var.secrets : s.name => s
    if s.rotation_lambda_arn != null
  }

  secret_id           = aws_secretsmanager_secret.secrets[each.key].id
  rotation_lambda_arn = each.value.rotation_lambda_arn

  rotation_rules {
    automatically_after_days = each.value.rotation_days
  }
}

resource "aws_secretsmanager_secret_policy" "secrets" {
  for_each = {
    for s in var.secrets : s.name => s
    if length(s.allowed_principal_arns) > 0
  }

  secret_arn = aws_secretsmanager_secret.secrets[each.key].arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "AllowPrincipals"
          Effect = "Allow"
          Principal = {
            AWS = each.value.allowed_principal_arns
          }
          Action = [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
          ]
          Resource = "*"
        }
      ],
      var.deny_non_tls ? [
        {
          Sid    = "DenyNonTLS"
          Effect = "Deny"
          Principal = {
            AWS = "*"
          }
          Action   = "secretsmanager:*"
          Resource = "*"
          Condition = {
            Bool = {
              "aws:SecureTransport" = "false"
            }
          }
        }
      ] : []
    )
  })
}

resource "aws_kms_key" "secrets" {
  count = var.create_kms_key ? 1 : 0

  description             = "KMS key for ${var.project} ${var.environment} Secrets Manager"
  deletion_window_in_days = var.environment == "production" ? 30 : 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowSecretsManager"
        Effect = "Allow"
        Principal = {
          Service = "secretsmanager.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowKeyUsers"
        Effect = "Allow"
        Principal = {
          AWS = var.kms_key_user_arns
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project}-${var.environment}-secrets-kms"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_alias" "secrets" {
  count = var.create_kms_key ? 1 : 0

  name          = "alias/${var.project}-${var.environment}-secrets"
  target_key_id = aws_kms_key.secrets[0].key_id
}

data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "read_secrets" {
  name        = "${var.project}-${var.environment}-read-secrets"
  description = "Allows reading all ${var.project} ${var.environment} secrets from Secrets Manager"
  path        = "/${var.project}/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "AllowGetSecretValue"
          Effect = "Allow"
          Action = [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret",
            "secretsmanager:ListSecretVersionIds"
          ]
          Resource = [
            for s in aws_secretsmanager_secret.secrets :
            s.arn
          ]
        },
        {
          Sid    = "AllowListSecrets"
          Effect = "Allow"
          Action = [
            "secretsmanager:ListSecrets"
          ]
          Resource = "*"
        }
      ],
      var.create_kms_key ? [
        {
          Sid    = "AllowKMSDecrypt"
          Effect = "Allow"
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:GenerateDataKey"
          ]
          Resource = [aws_kms_key.secrets[0].arn]
        }
      ] : []
    )
  })

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_policy" "write_secrets" {
  name        = "${var.project}-${var.environment}-write-secrets"
  description = "Allows creating and updating ${var.project} ${var.environment} secrets"
  path        = "/${var.project}/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "AllowWriteSecrets"
          Effect = "Allow"
          Action = [
            "secretsmanager:CreateSecret",
            "secretsmanager:UpdateSecret",
            "secretsmanager:PutSecretValue",
            "secretsmanager:TagResource",
            "secretsmanager:UntagResource"
          ]
          Resource = [
            for s in aws_secretsmanager_secret.secrets :
            s.arn
          ]
        }
      ],
      var.create_kms_key ? [
        {
          Sid    = "AllowKMSEncrypt"
          Effect = "Allow"
          Action = [
            "kms:GenerateDataKey",
            "kms:Decrypt",
            "kms:DescribeKey"
          ]
          Resource = [aws_kms_key.secrets[0].arn]
        }
      ] : []
    )
  })

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "secret_access_failure" {
  count = var.enable_access_failure_alarm && length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-secrets-access-failure"
  alarm_description   = "One or more Secrets Manager access attempts failed in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ResourceCount"
  namespace           = "AWS/SecretsManager"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns

  dimensions = {
    Operation = "GetSecretValue"
  }

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_secret_access" {
  count = var.cloudtrail_log_group_name != null ? 1 : 0

  name           = "${var.project}-${var.environment}-unauthorized-secret-access"
  log_group_name = var.cloudtrail_log_group_name
  pattern        = "{ ($.eventSource = \"secretsmanager.amazonaws.com\") && ($.errorCode = \"AccessDeniedException\") }"

  metric_transformation {
    name          = "UnauthorizedSecretAccess"
    namespace     = "${var.project}/${var.environment}/Security"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_secret_access" {
  count = var.cloudtrail_log_group_name != null && length(var.sns_alarm_topic_arns) > 0 ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-unauthorized-secret-access"
  alarm_description   = "Unauthorized attempt to access a secret detected in ${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedSecretAccess"
  namespace           = "${var.project}/${var.environment}/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.sns_alarm_topic_arns

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
