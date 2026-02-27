# Production Environment — Lomash Wood

Terraform configuration for the `production` environment. This is the live customer-facing stack serving `lomashwood.co.uk`. All changes must be peer-reviewed, applied via the CI/CD pipeline, and confirmed against a staging deployment before reaching production.

---

## ⚠️ Production Change Protocol

1. All Terraform changes must be merged to `main` via a pull request with at least one approval
2. Changes must be validated in `staging` first — no direct production-only changes
3. `terraform plan` output must be reviewed and attached to the PR before merging
4. `terraform apply` is run exclusively by the GitHub Actions `deploy-production.yml` workflow
5. Manual `terraform apply` from a local machine requires explicit incident-level justification and a Slack alert
6. Deletion protection is enabled on RDS — the DynamoDB lock table prevents concurrent state writes

---

## Environment Philosophy

Production is provisioned for reliability, security, and performance above all other concerns.

| Concern | Production Setting |
|---|---|
| NAT Gateways | 1 per AZ (3 total, HA) |
| RDS | `db.r7g.large`, Multi-AZ, read replica |
| RDS Backup | 14-day retention, final snapshot on destroy |
| RDS Deletion Protection | **Enabled** |
| Redis | `cache.r7g.large`, 3-node cluster |
| ECS Replicas | 3 per service |
| ECS CPU/Memory | 1024/2048 (gateway, auth, product, payments) |
| KMS | Dedicated CMK, 30-day deletion window, auto-rotation |
| Secrets Rotation | Database (30d), Redis (60d), JWT (90d), API key (90d) |
| WAF | CloudFront WAF WebACL (us-east-1) |
| Origin Shield | Enabled (`eu-west-1`) |
| VPC Flow Logs | 90-day retention |
| CloudWatch Logs | 90-day retention |
| Performance Insights | Enabled (7 days) |
| Enhanced Monitoring | 60-second intervals |
| Budget Alarm | $1000/month (80% actual + 100% forecasted) |
| S3 Media Lifecycle | IA at 90d → Glacier at 365d |
| S3 Backups | IA at 30d → Glacier at 90d → Deep Archive at 365d |
| Stripe Keys | **Live mode** |
| `force_destroy` | Disabled on all S3 buckets |
| `deletion_protection` | Enabled on RDS |
| Alarm Thresholds | Full production sensitivity |
| `LOG_LEVEL` | `warn` (structured JSON) |

---

## Stack Overview

```
         Route 53
         ├── lomashwood.co.uk    ─── A (alias)
         └── www.lomashwood.co.uk ── A (alias)
                  │
         CloudFront (HTTP/2+3, Origin Shield eu-west-1, WAF)
         ├── /media/*  ──────────────► S3 Media (OAC SigV4)  ──► IA → Glacier
         ├── /uploads/* ─────────────► S3 Media (OAC SigV4)
         └── /* ─────────────────────► ALB (X-CloudFront-Secret)
                                              │
              ┌───────────────────────────────┤
              │        ECS Fargate (3 replicas per service)
              ├── api-gateway           :3000   1024 CPU  / 2048 MB
              ├── auth-service          :3001   1024 CPU  / 2048 MB
              ├── product-service       :3002   1024 CPU  / 2048 MB
              ├── order-payment-service :3003   1024 CPU  / 2048 MB
              ├── appointment-service   :3004    512 CPU  / 1024 MB
              ├── content-service       :3005    512 CPU  / 1024 MB
              ├── customer-service      :3006    512 CPU  / 1024 MB
              ├── notification-service  :3007    512 CPU  / 1024 MB
              └── analytics-service     :3008    512 CPU  / 1024 MB
                             │
         ┌─────────────────────────────────────┐
         │                                     │
  RDS PostgreSQL 16                 ElastiCache Redis 7
  db.r7g.large / Multi-AZ           cache.r7g.large / 3 nodes
  + Read Replica (db.r7g.large)      Auto-failover enabled
  14-day backups / PI enabled        7-day snapshots
```

---

## Modules Composed

| Module | Key Production Settings |
|---|---|
| `vpc` | 3 AZs, 3 NAT gateways, VPC flow logs 90 days |
| `kms` | Dedicated CMK, auto-rotation, 30-day deletion window |
| `monitoring` | Dual SNS topics, Slack Lambda, full alarms, 90-day log retention, budget alarm |
| `s3_media` | Versioned, CloudFront OAC, IA + Glacier lifecycle, 50 GB size alarm |
| `s3_uploads` | KMS-encrypted, SQS notifications, temp 1-day expiry |
| `s3_logs` | ALB + CloudFront + S3 access logs, 90-day retention |
| `s3_backups` | Versioned, KMS, IA → Glacier → Deep Archive lifecycle |
| `secrets` | 15 secrets, KMS-encrypted, automatic rotation on 4 secrets, CloudTrail alarm |
| `rds` | PostgreSQL 16, `db.r7g.large`, Multi-AZ, read replica, Performance Insights, Enhanced Monitoring |
| `redis` | Redis 7, `cache.r7g.large`, 3-node cluster, 7-day snapshots |
| `alb` | HTTPS, 15-second health checks, deletion protection enabled |
| `cloudfront` | Origin Shield, WAF WebACL, 1-year static TTL, HTTP/2+3 |
| `ecs` | 9 services, 3 replicas each, all secrets injected, `LOG_LEVEL=warn` |

---

## Secrets Managed (15 Total)

| Secret Path | Group | Rotation |
|---|---|---|
| `database/primary` | database | 30 days (Lambda) |
| `database/replica` | database | — |
| `redis/auth-token` | cache | 60 days (Lambda) |
| `auth/jwt-secret` | auth | 90 days (Lambda) |
| `auth/better-auth-secret` | auth | — |
| `stripe/secret-key` | payments | — (Stripe portal) |
| `stripe/webhook-secret` | payments | — |
| `stripe/restricted-key` | payments | — |
| `email/smtp-credentials` | notifications | — |
| `notifications/twilio` | notifications | — |
| `notifications/firebase` | notifications | — |
| `storage/s3-credentials` | storage | — |
| `api-gateway/internal-api-key` | api | 90 days (Lambda) |
| `cloudfront/origin-secret` | api | — |
| `analytics/google-tag-manager` | analytics | — |

---

## Prerequisites

Bootstrap the remote state backend before the first `terraform init`. This is a one-time operation per AWS account.

```bash
# Create production state bucket
aws s3api create-bucket \
  --bucket lomash-wood-terraform-state-production \
  --region eu-west-1 \
  --create-bucket-configuration LocationConstraint=eu-west-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket lomash-wood-terraform-state-production \
  --versioning-configuration Status=Enabled

# Block all public access
aws s3api put-public-access-block \
  --bucket lomash-wood-terraform-state-production \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket lomash-wood-terraform-state-production \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name lomash-wood-terraform-locks-production \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-west-1

# Create RDS Enhanced Monitoring role (if not already created from staging)
aws iam create-role \
  --role-name rds-enhanced-monitoring-production \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "monitoring.rds.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name rds-enhanced-monitoring-production \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
```

---

## Sensitive Variables

Never commit secrets to source control. All sensitive values flow through GitHub Actions secrets in CI/CD and are passed as `-var` flags at apply time.

`secrets.tfvars` (git-ignored, for emergency local use only):

```hcl
db_password                    = "prod-db-password"
redis_auth_token               = "prod-redis-auth-token-32chars+"
jwt_secret                     = "prod-jwt-secret-64chars..."
better_auth_secret             = "prod-better-auth-secret-64chars..."
stripe_secret_key              = "sk_live_..."
stripe_webhook_secret          = "whsec_..."
stripe_restricted_key          = "rk_live_..."
smtp_username                  = "AKIAIOSFODNN7EXAMPLE"
smtp_password                  = "wJalrXUtnFEMI..."
twilio_account_sid             = "AC..."
twilio_auth_token              = "..."
twilio_from_number             = "+447..."
firebase_service_account_json  = "{\"type\":\"service_account\",...}"
s3_access_key_id               = "AKIAIOSFODNN7EXAMPLE"
s3_secret_access_key           = "wJalrXUtnFEMI..."
internal_api_key               = "prod-internal-api-key-64chars..."
cloudfront_origin_secret       = "prod-cf-origin-secret-32chars+"
acm_certificate_arn            = "arn:aws:acm:eu-west-1:123456789:certificate/..."
cloudfront_acm_certificate_arn = "arn:aws:acm:us-east-1:123456789:certificate/..."
waf_web_acl_arn_us_east_1      = "arn:aws:wafv2:us-east-1:123456789:global/webacl/..."
ecr_repository_url             = "123456789.dkr.ecr.eu-west-1.amazonaws.com/lomash-wood"
rds_monitoring_role_arn        = "arn:aws:iam::123456789:role/rds-enhanced-monitoring-production"
kms_key_administrator_arns     = ["arn:aws:iam::123456789:role/ProductionDeployRole"]
alert_email_endpoints          = ["devops@lomashwood.co.uk"]
critical_alert_email_endpoints = ["oncall@lomashwood.co.uk", "cto@lomashwood.co.uk"]
slack_webhook_lambda_arn       = "arn:aws:lambda:eu-west-1:123456789:function:slack-notifier"
cloudfront_domain_aliases      = ["lomashwood.co.uk", "www.lomashwood.co.uk"]
allowed_origins                = ["https://lomashwood.co.uk", "https://www.lomashwood.co.uk"]
gtm_container_id               = "GTM-XXXXXXX"
gsc_verification_token         = "google-site-verification=..."
upload_events_sqs_arn          = "arn:aws:sqs:eu-west-1:123456789:lomash-wood-production-uploads"
cloudtrail_log_group_name      = "/aws/cloudtrail/lomash-wood-production"
```

---

## Deployment

```bash
cd infra/terraform/envs/production

# Initialise (first time or after provider updates)
terraform init

# Always plan before applying — review every change carefully
terraform plan -var-file="secrets.tfvars" -out=tfplan

# Review the saved plan
terraform show tfplan

# Apply the saved plan (guarantees exactly what was reviewed is applied)
terraform apply tfplan
```

---

## CI/CD Integration

Production deployments are triggered automatically on merge to `main` via `.github/workflows/deploy-production.yml`. All secrets are stored in GitHub Actions environment secrets scoped to the `production` environment, which requires a manual approval gate.

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
          aws-region: eu-west-1

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"

      - name: Terraform Init
        working-directory: infra/terraform/envs/production
        run: terraform init

      - name: Terraform Plan
        working-directory: infra/terraform/envs/production
        run: |
          terraform plan -out=tfplan \
            -var="container_image_tag=${{ github.sha }}" \
            -var="db_password=${{ secrets.PROD_DB_PASSWORD }}" \
            -var="redis_auth_token=${{ secrets.PROD_REDIS_AUTH_TOKEN }}" \
            -var="jwt_secret=${{ secrets.PROD_JWT_SECRET }}" \
            -var="better_auth_secret=${{ secrets.PROD_BETTER_AUTH_SECRET }}" \
            -var="stripe_secret_key=${{ secrets.PROD_STRIPE_SECRET_KEY }}" \
            -var="stripe_webhook_secret=${{ secrets.PROD_STRIPE_WEBHOOK_SECRET }}" \
            -var="stripe_restricted_key=${{ secrets.PROD_STRIPE_RESTRICTED_KEY }}" \
            -var="smtp_username=${{ secrets.PROD_SMTP_USERNAME }}" \
            -var="smtp_password=${{ secrets.PROD_SMTP_PASSWORD }}" \
            -var="twilio_account_sid=${{ secrets.PROD_TWILIO_SID }}" \
            -var="twilio_auth_token=${{ secrets.PROD_TWILIO_TOKEN }}" \
            -var="internal_api_key=${{ secrets.PROD_INTERNAL_API_KEY }}" \
            -var="cloudfront_origin_secret=${{ secrets.PROD_CF_ORIGIN_SECRET }}" \
            -var="firebase_service_account_json=${{ secrets.PROD_FIREBASE_SA_JSON }}" \
            -var="s3_access_key_id=${{ secrets.PROD_S3_ACCESS_KEY_ID }}" \
            -var="s3_secret_access_key=${{ secrets.PROD_S3_SECRET_ACCESS_KEY }}" \
            -var="acm_certificate_arn=${{ secrets.PROD_ACM_CERT_ARN }}" \
            -var="cloudfront_acm_certificate_arn=${{ secrets.PROD_CF_ACM_CERT_ARN }}" \
            -var="ecr_repository_url=${{ secrets.ECR_REPOSITORY_URL }}" \
            -var="rds_monitoring_role_arn=${{ secrets.PROD_RDS_MONITORING_ROLE_ARN }}" \
            -var-file="terraform.tfvars"

      - name: Terraform Apply
        working-directory: infra/terraform/envs/production
        run: terraform apply -auto-approve tfplan
```

---

## Variable Reference

| Variable | Description | Sensitive | Required |
|---|---|---|---|
| `project` | Project name | no | default |
| `environment` | Environment name | no | default |
| `aws_region` | Primary AWS region | no | tfvars |
| `primary_domain` | Root domain (e.g. lomashwood.co.uk) | no | tfvars |
| `vpc_cidr` | VPC CIDR block | no | tfvars |
| `availability_zones` | AZ list (3 required) | no | tfvars |
| `db_name` | PostgreSQL database name | no | tfvars |
| `db_username` | PostgreSQL master username | no | tfvars |
| `db_password` | PostgreSQL master password | **yes** | secret |
| `db_rotation_lambda_arn` | Lambda for DB secret rotation | no | optional |
| `redis_auth_token` | Redis AUTH token | **yes** | secret |
| `redis_rotation_lambda_arn` | Lambda for Redis secret rotation | no | optional |
| `jwt_secret` | JWT signing secret | **yes** | secret |
| `jwt_rotation_lambda_arn` | Lambda for JWT rotation | no | optional |
| `better_auth_secret` | Better Auth secret key | **yes** | secret |
| `stripe_secret_key` | Stripe live secret key | **yes** | secret |
| `stripe_webhook_secret` | Stripe webhook signing secret | **yes** | secret |
| `stripe_restricted_key` | Stripe live restricted key | **yes** | secret |
| `smtp_username` | SES SMTP username | **yes** | secret |
| `smtp_password` | SES SMTP password | **yes** | secret |
| `smtp_from_address` | From address for emails | no | tfvars |
| `twilio_account_sid` | Twilio account SID | **yes** | secret |
| `twilio_auth_token` | Twilio auth token | **yes** | secret |
| `twilio_from_number` | Twilio sender number | no | tfvars |
| `firebase_service_account_json` | Firebase SA JSON | **yes** | secret |
| `s3_access_key_id` | S3 IAM access key | **yes** | secret |
| `s3_secret_access_key` | S3 IAM secret key | **yes** | secret |
| `internal_api_key` | Inter-service API key | **yes** | secret |
| `api_key_rotation_lambda_arn` | Lambda for API key rotation | no | optional |
| `acm_certificate_arn` | ALB ACM cert (eu-west-1) | no | secret |
| `cloudfront_acm_certificate_arn` | CloudFront ACM cert (us-east-1) | no | secret |
| `cloudfront_domain_aliases` | CF CNAME aliases | no | tfvars |
| `cloudfront_origin_secret` | CF→ALB secret header | **yes** | secret |
| `waf_web_acl_arn_us_east_1` | WAF WebACL ARN (us-east-1) | no | optional |
| `allowed_origins` | CORS allowed origins | no | tfvars |
| `upload_events_sqs_arn` | SQS for upload event notifications | no | optional |
| `cloudtrail_log_group_name` | CloudTrail CW log group | no | optional |
| `rds_monitoring_role_arn` | RDS enhanced monitoring IAM role | no | required |
| `kms_key_administrator_arns` | KMS key admin IAM ARNs | no | tfvars |
| `alert_email_endpoints` | General alert emails | no | tfvars |
| `critical_alert_email_endpoints` | Critical alert emails | no | tfvars |
| `slack_webhook_lambda_arn` | Slack notifier Lambda ARN | no | optional |
| `container_image_tag` | Docker image tag (set by CI) | no | CI var |
| `ecr_repository_url` | ECR base URL | no | secret |
| `monthly_budget_limit_usd` | AWS budget limit (USD) | no | tfvars |
| `gtm_container_id` | Google Tag Manager container ID | no | tfvars |
| `gsc_verification_token` | Google Search Console token | no | tfvars |

---

## Remote State Backend

| Setting | Value |
|---|---|
| Bucket | `lomash-wood-terraform-state-production` |
| Key | `envs/production/terraform.tfstate` |
| Region | `eu-west-1` |
| Encryption | AES256 |
| Lock Table | `lomash-wood-terraform-locks-production` |

Cross-environment state reference:

```hcl
data "terraform_remote_state" "production" {
  backend = "s3"

  config = {
    bucket = "lomash-wood-terraform-state-production"
    key    = "envs/production/terraform.tfstate"
    region = "eu-west-1"
  }
}
```

---

## Key Differences vs Staging

| Feature | Staging | Production |
|---|---|---|
| RDS instance | `db.t3.small` | `db.r7g.large` |
| Redis instance | `cache.t3.small` | `cache.r7g.large` |
| Redis nodes | 2 | 3 |
| ECS replicas | 2 | 3 |
| ECS CPU (gateway/auth/product/payments) | 512 | 1024 |
| ECS Memory (gateway/auth/product/payments) | 1024 MB | 2048 MB |
| RDS backup retention | 7 days | 14 days |
| RDS deletion protection | Off | **On** |
| S3 `force_destroy` | Off | **Off** |
| Secrets rotation | None | DB, Redis, JWT, API key |
| Stripe keys | Test | **Live** |
| WAF WebACL | None | CloudFront WAF |
| Origin Shield | Off | **On** |
| S3 backups bucket | None | Included (IA → Glacier → Deep Archive) |
| Log retention | 30 days | 90 days |
| RDS storage | 50 GB / 200 GB max | 100 GB / 1 TB max |
| Budget alarm | $300 | $1000 |
| `LOG_LEVEL` | info | warn |
| Secrets count | 11 | 15 |

---

## Cost Estimate (Approximate)

| Resource | Monthly Cost |
|---|---|
| ECS Fargate (9 services — mix of 1024/512 CPU, 3 replicas, ~730 hrs) | ~$540 |
| RDS `db.r7g.large` Multi-AZ + read replica | ~$520 |
| ElastiCache `cache.r7g.large` × 3 | ~$390 |
| ALB | ~$25 |
| NAT Gateways × 3 (production traffic) | ~$150 |
| CloudFront (production traffic) | ~$30 |
| S3 (4 buckets — media, uploads, logs, backups) | ~$25 |
| CloudWatch (logs + alarms + dashboard) | ~$30 |
| KMS (CMK + API calls) | ~$5 |
| Secrets Manager (15 secrets) | ~$8 |
| WAF WebACL | ~$10 |
| VPC Flow Logs | ~$15 |
| **Total** | **~$1,748/month** |

Costs scale with traffic. CloudFront, NAT, and data transfer costs increase proportionally with visitor volume.
