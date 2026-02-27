# Secrets Module — Lomash Wood

Provisions AWS Secrets Manager secrets for all services with optional dedicated KMS encryption, per-secret IAM policies, automatic rotation hooks, read/write IAM policies, and CloudWatch security alarms.

## Resources Created

| Resource | Description |
|---|---|
| `aws_secretsmanager_secret` | One secret per entry in `var.secrets` |
| `aws_secretsmanager_secret_version` | Initial value for secrets that supply one |
| `aws_secretsmanager_secret_rotation` | Rotation config for secrets with a Lambda ARN |
| `aws_secretsmanager_secret_policy` | Per-secret resource policy for principal access + TLS deny |
| `aws_kms_key` | Dedicated KMS key (conditional) |
| `aws_kms_alias` | KMS alias (conditional) |
| `aws_iam_policy` (read) | Policy to read all module secrets |
| `aws_iam_policy` (write) | Policy to write all module secrets |
| `aws_cloudwatch_log_metric_filter` | CloudTrail filter for unauthorized access (conditional) |
| `aws_cloudwatch_metric_alarm` (x2) | Access failure + unauthorized access alarms (conditional) |

## Secret Naming Convention

All secrets are namespaced as:

```
{project}/{environment}/{name}
```

For example: `lomash-wood/production/database/primary`

## Usage

### Full Production Setup

```hcl
module "secrets" {
  source = "../../modules/secrets"

  project     = "lomash-wood"
  environment = "production"

  create_kms_key    = true
  kms_key_user_arns = [
    module.ecs.task_execution_role_arn,
    module.ecs.task_role_arn
  ]

  secrets = [
    {
      name        = "database/primary"
      description = "PostgreSQL primary database credentials"
      group       = "database"
      initial_value = jsonencode({
        host     = module.rds.primary_endpoint
        port     = 5432
        dbname   = "lomash_wood"
        username = "lomash_app"
        password = "REPLACE_ME"
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
      rotation_lambda_arn    = aws_lambda_function.db_rotation.arn
      rotation_days          = 30
    },
    {
      name        = "redis/auth-token"
      description = "Redis AUTH token and connection details"
      group       = "cache"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "auth/jwt-secret"
      description = "JWT signing secret for Better Auth"
      group       = "auth"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "auth/better-auth-secret"
      description = "Better Auth secret key"
      group       = "auth"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "stripe/secret-key"
      description = "Stripe secret API key for payment processing"
      group       = "payments"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "stripe/webhook-secret"
      description = "Stripe webhook endpoint signing secret"
      group       = "payments"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "email/smtp-credentials"
      description = "SMTP credentials for Nodemailer / AWS SES"
      group       = "notifications"
      initial_value = jsonencode({
        host     = "email-smtp.eu-west-1.amazonaws.com"
        port     = 587
        username = "REPLACE_ME"
        password = "REPLACE_ME"
      })
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "notifications/twilio"
      description = "Twilio account SID and auth token for SMS"
      group       = "notifications"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "notifications/firebase"
      description = "Firebase service account JSON for push notifications"
      group       = "notifications"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "aws/s3-media-credentials"
      description = "IAM access key for S3 media bucket access from services"
      group       = "storage"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "api-gateway/internal-api-key"
      description = "Internal API key used for inter-service communication via the API gateway"
      group       = "api"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    },
    {
      name        = "google/tag-manager-id"
      description = "Google Tag Manager container ID"
      group       = "analytics"
      allowed_principal_arns = [module.ecs.task_execution_role_arn]
    }
  ]

  cloudtrail_log_group_name   = var.cloudtrail_log_group_name
  enable_access_failure_alarm = true
  sns_alarm_topic_arns        = [aws_sns_topic.alerts.arn]
}
```

### Attaching Read Policy to ECS Task Role

```hcl
resource "aws_iam_role_policy_attachment" "ecs_read_secrets" {
  role       = module.ecs.task_execution_role_name
  policy_arn = module.secrets.read_secrets_policy_arn
}
```

### Accessing a Secret ARN in Another Module

```hcl
environment_secrets = [
  {
    name      = "DB_PASSWORD"
    valueFrom = module.secrets.secret_arns["database/primary"]
  },
  {
    name      = "STRIPE_SECRET_KEY"
    valueFrom = module.secrets.secret_arns["stripe/secret-key"]
  }
]
```

## Secret Groups

Secrets are tagged with a `group` to logically separate concerns:

| Group | Secrets |
|---|---|
| `database` | PostgreSQL credentials per service |
| `cache` | Redis auth token |
| `auth` | JWT secret, Better Auth secret |
| `payments` | Stripe secret key, webhook secret |
| `notifications` | SMTP, Twilio, Firebase credentials |
| `storage` | S3 IAM keys |
| `api` | Internal API keys |
| `analytics` | GTM, Google Search Console tokens |

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name | `string` | `"lomash-wood"` | no |
| `environment` | Deployment environment | `string` | — | yes |
| `secrets` | List of secret definitions | `list(object)` | `[]` | no |
| `kms_key_arn` | Existing KMS key ARN (null = AWS-managed key) | `string` | `null` | no |
| `create_kms_key` | Create a dedicated KMS key | `bool` | `false` | no |
| `kms_key_user_arns` | IAM ARNs allowed to use the KMS key | `list(string)` | `[]` | no |
| `deny_non_tls` | Add TLS-deny statement to all secret policies | `bool` | `true` | no |
| `enable_access_failure_alarm` | CloudWatch alarm for access failures | `bool` | `false` | no |
| `cloudtrail_log_group_name` | CloudTrail log group for unauthorized-access filter | `string` | `null` | no |
| `sns_alarm_topic_arns` | SNS topics for CloudWatch alarms | `list(string)` | `[]` | no |

### Secret Object Fields

| Field | Description | Type | Required |
|---|---|---|---|
| `name` | Secret name suffix (appended to project/environment/) | `string` | yes |
| `description` | Human-readable description | `string` | yes |
| `group` | Logical group tag (database, auth, payments, etc.) | `string` | yes |
| `initial_value` | Initial secret string value (ignored after first apply) | `string` | no |
| `allowed_principal_arns` | IAM ARNs permitted to GetSecretValue | `list(string)` | no |
| `rotation_lambda_arn` | Lambda ARN for automatic rotation | `string` | no |
| `rotation_days` | Rotation interval in days | `number` | no (default 30) |

## Outputs

| Name | Description |
|---|---|
| `secret_arns` | Map of name → ARN for all secrets |
| `secret_ids` | Map of name → ID (full path) for all secrets |
| `secret_version_ids` | Map of name → version ID for seeded secrets |
| `kms_key_arn` | KMS key ARN (null if not created) |
| `kms_key_id` | KMS key ID (null if not created) |
| `kms_key_alias_arn` | KMS alias ARN (null if not created) |
| `read_secrets_policy_arn` | IAM policy ARN for reading all secrets |
| `write_secrets_policy_arn` | IAM policy ARN for writing all secrets |
| `access_failure_alarm_arn` | CloudWatch alarm ARN for access failures (null if not created) |
| `unauthorized_access_alarm_arn` | CloudWatch alarm ARN for unauthorized access (null if not created) |

## Security Notes

- Recovery window is **30 days** in production and **7 days** in other environments to prevent accidental deletion
- All secret policies include a `DenyNonTLS` statement by default (set `deny_non_tls = false` to disable)
- Initial secret values use `lifecycle { ignore_changes = [secret_string] }` — rotate values outside Terraform after first apply
- When `create_kms_key = true`, key rotation is automatically enabled
- Attach `read_secrets_policy_arn` to ECS task execution roles; attach `write_secrets_policy_arn` to CI/CD pipeline roles only
- Enable `cloudtrail_log_group_name` in production to receive unauthorized-access security alarms