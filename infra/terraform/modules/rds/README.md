# Terraform Module: RDS

Provisions a production-grade AWS RDS PostgreSQL instance with automated password management via Secrets Manager, parameter group tuning, enhanced monitoring, Performance Insights, read replicas, and CloudWatch alarms for the Lomash Wood backend.

## Resources Created

| Resource | Description |
|---|---|
| `aws_db_parameter_group` | Custom PostgreSQL parameter group with logging + pg_stat_statements |
| `aws_db_option_group` | RDS option group for PostgreSQL |
| `random_password` | 32-character random master password |
| `aws_secretsmanager_secret` | Secrets Manager secret for DB credentials |
| `aws_secretsmanager_secret_version` | Stores username, password, host, port, dbname, full URL |
| `aws_db_instance` (main) | Primary RDS PostgreSQL instance with encryption, backups, monitoring |
| `aws_db_instance` (replica) | Optional read replicas (0–5) |
| `aws_iam_role` | Enhanced monitoring IAM role |
| `aws_iam_role_policy_attachment` | Attaches `AmazonRDSEnhancedMonitoringRole` |
| `aws_cloudwatch_metric_alarm` (cpu) | Alarm when CPU > 80% |
| `aws_cloudwatch_metric_alarm` (storage) | Alarm when free storage < 5 GB |
| `aws_cloudwatch_metric_alarm` (memory) | Alarm when freeable memory < 256 MB |
| `aws_cloudwatch_metric_alarm` (connections) | Alarm when connection count is high |
| `aws_cloudwatch_metric_alarm` (replica lag) | Alarm when replica lag > 30 seconds |

## Usage

```hcl
module "rds" {
  source = "../../modules/rds"

  project     = "lomash-wood"
  environment = "production"

  rds_security_group_id = module.vpc.rds_security_group_id
  db_subnet_group_name  = module.vpc.db_subnet_group_name
  kms_key_arn           = module.secrets.kms_key_arn

  engine_version         = "16.2"
  parameter_group_family = "postgres16"
  instance_class         = "db.t3.large"
  allocated_storage      = 50
  max_allocated_storage  = 200

  database_name   = "lomash_wood"
  master_username = "lomash_admin"

  multi_az            = true
  deletion_protection = true

  backup_retention_period = 14
  backup_window           = "02:00-02:30"
  maintenance_window      = "sun:03:00-sun:04:00"
  auto_minor_version_upgrade = true

  enable_performance_insights          = true
  performance_insights_retention_period = 7
  monitoring_interval                  = 60

  read_replica_count          = 1
  read_replica_instance_class = "db.t3.medium"

  max_connections_alarm_threshold = 200
  alarm_sns_topic_arn             = module.monitoring.alerts_sns_topic_arn

  db_parameters = [
    {
      name  = "max_connections"
      value = "200"
    },
    {
      name  = "work_mem"
      value = "16384"
    }
  ]

  tags = {
    Project     = "lomash-wood"
    Environment = "production"
    ManagedBy   = "terraform"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name prefix | `string` | — | yes |
| `environment` | Deployment environment | `string` | — | yes |
| `rds_security_group_id` | RDS security group ID | `string` | — | yes |
| `db_subnet_group_name` | DB subnet group name | `string` | — | yes |
| `kms_key_arn` | KMS key ARN for encryption | `string` | `null` | no |
| `engine_version` | PostgreSQL engine version | `string` | `16.2` | no |
| `parameter_group_family` | Parameter group family | `string` | `postgres16` | no |
| `instance_class` | RDS instance class | `string` | `db.t3.medium` | no |
| `allocated_storage` | Initial storage in GB | `number` | `20` | no |
| `max_allocated_storage` | Max storage for autoscaling | `number` | `100` | no |
| `database_name` | Default database name | `string` | `lomash_wood` | no |
| `master_username` | Master DB username | `string` | `lomash_admin` | no |
| `multi_az` | Enable Multi-AZ | `bool` | `false` | no |
| `deletion_protection` | Enable deletion protection | `bool` | `true` | no |
| `backup_retention_period` | Backup retention in days | `number` | `7` | no |
| `backup_window` | Daily backup window (UTC) | `string` | `02:00-02:30` | no |
| `maintenance_window` | Weekly maintenance window | `string` | `sun:03:00-sun:04:00` | no |
| `auto_minor_version_upgrade` | Auto minor version upgrade | `bool` | `true` | no |
| `enable_performance_insights` | Enable Performance Insights | `bool` | `true` | no |
| `performance_insights_retention_period` | Insights retention (7 or 731 days) | `number` | `7` | no |
| `monitoring_interval` | Enhanced monitoring interval (seconds) | `number` | `60` | no |
| `read_replica_count` | Number of read replicas (0–5) | `number` | `0` | no |
| `read_replica_instance_class` | Read replica instance class | `string` | `null` | no |
| `db_parameters` | Custom parameter group params | `list(object)` | `[]` | no |
| `max_connections_alarm_threshold` | Connection count alarm threshold | `number` | `100` | no |
| `alarm_sns_topic_arn` | SNS topic ARN for alarms | `string` | `null` | no |
| `tags` | Common resource tags | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|---|---|
| `db_instance_id` | RDS instance ID |
| `db_instance_arn` | RDS instance ARN |
| `db_instance_address` | RDS hostname |
| `db_instance_endpoint` | RDS connection endpoint (host:port) |
| `db_instance_port` | RDS port |
| `db_instance_name` | Default database name |
| `db_instance_resource_id` | RDS resource ID (for IAM auth) |
| `db_parameter_group_name` | Parameter group name |
| `read_replica_ids` | Read replica instance IDs |
| `read_replica_addresses` | Read replica hostnames |
| `read_replica_endpoints` | Read replica endpoints |
| `master_credentials_secret_arn` | Secrets Manager ARN for credentials |
| `master_credentials_secret_name` | Secrets Manager secret name |
| `enhanced_monitoring_role_arn` | Enhanced monitoring IAM role ARN |

## Parameter Group Defaults

The following PostgreSQL parameters are always configured:

| Parameter | Value | Purpose |
|---|---|---|
| `log_connections` | `1` | Log all connections |
| `log_disconnections` | `1` | Log all disconnections |
| `log_duration` | `1` | Log query durations |
| `log_min_duration_statement` | `1000` | Log queries over 1 second |
| `log_statement` | `ddl` | Log DDL statements |
| `shared_preload_libraries` | `pg_stat_statements` | Enable query stats |
| `pg_stat_statements.track` | `ALL` | Track all statements |

## Credentials Secret Format

The Secrets Manager secret at `{project}/{environment}/rds/master-credentials` stores:

```json
{
  "username": "lomash_admin",
  "password": "...",
  "engine":   "postgres",
  "host":     "lomash-wood-production-postgres.xxxx.eu-west-2.rds.amazonaws.com",
  "port":     5432,
  "dbname":   "lomash_wood",
  "url":      "postgresql://lomash_admin:...@host:5432/lomash_wood"
}
```

## Notes

- Master password is auto-generated via `random_password` and never stored in Terraform state in plain text — always retrieved from Secrets Manager
- Storage type is `gp3` for better price/performance over `gp2`
- `lifecycle { ignore_changes = [password] }` prevents Terraform from rotating the password on every apply
- Production environment automatically sets `skip_final_snapshot = false` and `recovery_window_in_days = 30`
- `multi_az = true` is strongly recommended for staging and production
- Read replicas inherit the primary's security group and parameter group