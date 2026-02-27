# Dev Environment — Lomash Wood

Terraform configuration for the `dev` environment. Provisions a complete, cost-optimised infrastructure stack for local development workflows, feature branch testing, and integration validation.

## Environment Philosophy

The `dev` environment is intentionally under-resourced compared to staging and production:

| Concern | Dev Setting | Rationale |
|---|---|---|
| NAT Gateway | Single | Lowest cost — no HA required |
| RDS | `db.t3.micro`, single-AZ | Cheapest viable PostgreSQL |
| Redis | `cache.t3.micro`, 1 node | No HA required |
| ECS Tasks | 1 replica per service | Minimum viable footprint |
| Deletion Protection | Disabled | Fast teardown during development |
| Backups | 1 day retention | Just enough for accidental recovery |
| WAF | Disabled | Not needed in non-public environment |
| Origin Shield | Disabled | Reduces latency cost in dev |
| Log Retention | 7 days | Keeps CloudWatch costs minimal |
| Budget Alarm | Disabled | Managed at org level for dev |
| Alarm Thresholds | Relaxed | Prevents alert fatigue during dev |

## Stack Overview

```
                          CloudFront CDN
                         /             \
                   S3 Media         ALB (HTTPS)
                                        |
                         ┌──────────────┼──────────────┐
                         │              │              │
                    api-gateway    auth-service   product-service
                         │              │              │
                    order-payment  appointment    content-service
                    -service       -service            │
                         │              │         customer-service
                    notification   analytics          │
                    -service       -service      (all via ECS Fargate)
                         │
                    RDS PostgreSQL + ElastiCache Redis
```

## Modules Composed

| Module | Config |
|---|---|
| `vpc` | 2 AZs, single NAT, no flow logs |
| `monitoring` | SNS topics, log groups, relaxed alarms |
| `s3_media` | Media bucket, no versioning |
| `s3_uploads` | Upload staging, 1-day temp expiry |
| `s3_logs` | Log bucket, 14-day retention |
| `secrets` | 7 secrets, AWS-managed KMS |
| `rds` | PostgreSQL 16, `db.t3.micro`, single-AZ |
| `redis` | Redis 7, `cache.t3.micro`, 1 node |
| `alb` | HTTPS, all 9 service target groups |
| `cloudfront` | Dual S3 + ALB origins, short TTLs |
| `ecs` | All 9 services, 256 CPU / 512 MB each |

## Prerequisites

Before running `terraform apply` for the first time, bootstrap the remote state infrastructure:

```bash
# Create the S3 state bucket
aws s3api create-bucket \
  --bucket lomash-wood-terraform-state-dev \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# Enable versioning on state bucket
aws s3api put-bucket-versioning \
  --bucket lomash-wood-terraform-state-dev \
  --versioning-configuration Status=Enabled

# Enable server-side encryption on state bucket
aws s3api put-bucket-encryption \
  --bucket lomash-wood-terraform-state-dev \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create the DynamoDB lock table
aws dynamodb create-table \
  --table-name lomash-wood-terraform-locks-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-west-1
```

## Sensitive Variables

Sensitive values **must not** be committed to source control. Supply them via environment variables, AWS Secrets Manager, or a `.tfvars` file excluded from git:

```bash
export TF_VAR_db_password="<dev-db-password>"
export TF_VAR_redis_auth_token="<min-16-char-token>"
export TF_VAR_jwt_secret="<64-char-random-string>"
export TF_VAR_better_auth_secret="<64-char-random-string>"
export TF_VAR_stripe_secret_key="sk_test_..."
export TF_VAR_stripe_webhook_secret="whsec_..."
export TF_VAR_smtp_username="<ses-smtp-username>"
export TF_VAR_smtp_password="<ses-smtp-password>"
export TF_VAR_acm_certificate_arn="arn:aws:acm:eu-west-1:..."
export TF_VAR_cloudfront_acm_certificate_arn="arn:aws:acm:us-east-1:..."
export TF_VAR_cloudfront_origin_secret="<random-string>"
export TF_VAR_ecr_repository_url="<account>.dkr.ecr.eu-west-1.amazonaws.com/lomash-wood"
```

Or store them in a `secrets.tfvars` file (add to `.gitignore`):

```hcl
db_password                    = "dev-super-secret"
redis_auth_token               = "dev-redis-auth-token-16+"
jwt_secret                     = "dev-jwt-secret-64chars..."
better_auth_secret             = "dev-better-auth-secret..."
stripe_secret_key              = "sk_test_..."
stripe_webhook_secret          = "whsec_..."
smtp_username                  = "AKIAIOSFODNN7EXAMPLE"
smtp_password                  = "wJalrXUtnFEMI..."
acm_certificate_arn            = "arn:aws:acm:eu-west-1:123456789:certificate/..."
cloudfront_acm_certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/..."
cloudfront_origin_secret       = "dev-cf-secret-abc123"
ecr_repository_url             = "123456789.dkr.ecr.eu-west-1.amazonaws.com/lomash-wood"
```

## Deployment

```bash
# Navigate to the dev environment
cd infra/terraform/envs/dev

# Initialise with remote backend
terraform init

# Preview changes
terraform plan -var-file="secrets.tfvars"

# Apply changes
terraform apply -var-file="secrets.tfvars"

# Apply with auto-approval (CI only)
terraform apply -var-file="secrets.tfvars" -auto-approve

# Destroy dev environment (fast teardown)
terraform destroy -var-file="secrets.tfvars"
```

## Non-Sensitive Variable Overrides

You can override non-sensitive defaults at the CLI without editing `terraform.tfvars`:

```bash
# Deploy a specific image tag
terraform apply \
  -var-file="secrets.tfvars" \
  -var="container_image_tag=sha-a1b2c3d"

# Add alert emails during active debugging sessions
terraform apply \
  -var-file="secrets.tfvars" \
  -var='alert_email_endpoints=["dev@lomashwood.co.uk"]'
```

## Variable Reference

| Variable | Description | Sensitive | Default |
|---|---|---|---|
| `project` | Project name | no | `"lomash-wood"` |
| `environment` | Environment name | no | `"dev"` |
| `aws_region` | Primary region | no | set in tfvars |
| `vpc_cidr` | VPC CIDR | no | `10.0.0.0/16` |
| `availability_zones` | AZ list | no | set in tfvars |
| `public_subnet_cidrs` | Public CIDRs | no | set in tfvars |
| `private_subnet_cidrs` | Private CIDRs | no | set in tfvars |
| `database_subnet_cidrs` | DB CIDRs | no | set in tfvars |
| `db_name` | PostgreSQL DB name | no | set in tfvars |
| `db_username` | PostgreSQL username | no | set in tfvars |
| `db_password` | PostgreSQL password | **yes** | — |
| `redis_auth_token` | Redis AUTH token | **yes** | — |
| `jwt_secret` | JWT signing secret | **yes** | — |
| `better_auth_secret` | Better Auth secret | **yes** | — |
| `stripe_secret_key` | Stripe secret key (test) | **yes** | — |
| `stripe_webhook_secret` | Stripe webhook secret | **yes** | — |
| `smtp_host` | SMTP host | no | set in tfvars |
| `smtp_port` | SMTP port | no | `587` |
| `smtp_username` | SMTP username | **yes** | — |
| `smtp_password` | SMTP password | **yes** | — |
| `acm_certificate_arn` | ALB ACM cert ARN | no | — |
| `cloudfront_acm_certificate_arn` | CloudFront ACM cert ARN (us-east-1) | no | `null` |
| `cloudfront_domain_aliases` | CloudFront CNAMEs | no | `[]` |
| `cloudfront_origin_secret` | CF→ALB secret header | **yes** | `"dev-cloudfront-secret"` |
| `alert_email_endpoints` | Alert email addresses | no | `[]` |
| `ecs_service_names` | ECS service list | no | all 9 services |
| `container_image_tag` | Docker image tag | no | `"latest"` |
| `ecr_repository_url` | ECR base URL | no | — |

## Remote State Backend

| Setting | Value |
|---|---|
| Bucket | `lomash-wood-terraform-state-dev` |
| Key | `envs/dev/terraform.tfstate` |
| Region | `eu-west-1` |
| Encryption | AES256 |
| Lock Table | `lomash-wood-terraform-locks-dev` |

## Referencing Dev State from Other Configurations

```hcl
data "terraform_remote_state" "dev" {
  backend = "s3"

  config = {
    bucket = "lomash-wood-terraform-state-dev"
    key    = "envs/dev/terraform.tfstate"
    region = "eu-west-1"
  }
}
```

## Key Differences vs Staging and Production

| Feature | Dev | Staging | Production |
|---|---|---|---|
| NAT Gateways | 1 | 1 per AZ | 1 per AZ |
| RDS Multi-AZ | No | Yes | Yes |
| RDS Instance | `db.t3.micro` | `db.t3.small` | `db.r7g.large` |
| Redis Nodes | 1 | 2 | 2+ |
| Redis Instance | `cache.t3.micro` | `cache.t3.small` | `cache.r7g.large` |
| ECS Replicas | 1 | 2 | 3+ |
| WAF | No | No | Yes |
| Origin Shield | No | No | Yes |
| KMS (Secrets) | AWS-managed | Dedicated key | Dedicated key |
| Log Retention | 7 days | 30 days | 90 days |
| Deletion Protection | Off | Off | On |
| Budget Alarm | Off | Off | On |

## Cost Estimate (Approximate)

| Resource | Monthly Cost |
|---|---|
| ECS Fargate (9 × 256 CPU / 512 MB, ~730 hrs) | ~$25 |
| RDS `db.t3.micro` | ~$15 |
| ElastiCache `cache.t3.micro` | ~$12 |
| ALB | ~$20 |
| NAT Gateway (low traffic) | ~$35 |
| S3 (3 buckets, minimal data) | ~$2 |
| CloudFront (low traffic) | ~$2 |
| CloudWatch (logs + alarms) | ~$5 |
| **Total** | **~$116/month** |

Tear down when not in use to reduce costs:

```bash
terraform destroy -var-file="secrets.tfvars"
```