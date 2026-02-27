# Redis Module — Lomash Wood

Provisions an AWS ElastiCache Redis replication group with encryption, CloudWatch alarms, Secrets Manager integration, and structured logging.

## Resources Created

| Resource | Description |
|---|---|
| `aws_elasticache_replication_group` | Primary Redis cluster with optional HA |
| `aws_elasticache_subnet_group` | Subnet group scoped to private subnets |
| `aws_elasticache_parameter_group` | Tuned Redis 7 parameter group |
| `aws_security_group` | Restricts inbound access to allowed SGs only |
| `aws_cloudwatch_log_group` (x2) | Slow logs + engine logs |
| `aws_cloudwatch_metric_alarm` (x4) | CPU, memory, connections, evictions |
| `aws_secretsmanager_secret` | Stores auth token + connection strings |

## Usage

```hcl
module "redis" {
  source = "../../modules/redis"

  project     = "lomash-wood"
  environment = "production"

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  allowed_security_group_ids = [
    module.ecs.app_security_group_id
  ]

  node_type          = "cache.r7g.large"
  num_cache_clusters = 2
  engine_version     = "7.0"
  auth_token         = var.redis_auth_token

  snapshot_retention_limit = 7
  log_retention_days       = 30

  sns_alarm_topic_arns = [aws_sns_topic.alerts.arn]
}
```

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name | `string` | `"lomash-wood"` | no |
| `environment` | Deployment environment | `string` | — | yes |
| `vpc_id` | VPC ID | `string` | — | yes |
| `private_subnet_ids` | Private subnet IDs | `list(string)` | — | yes |
| `allowed_security_group_ids` | SGs permitted to connect | `list(string)` | `[]` | no |
| `node_type` | ElastiCache node type | `string` | `"cache.t3.micro"` | no |
| `num_cache_clusters` | Number of nodes (1–6) | `number` | `1` | no |
| `engine_version` | Redis version | `string` | `"7.0"` | no |
| `auth_token` | Redis AUTH token (sensitive) | `string` | — | yes |
| `maxmemory_policy` | Eviction policy | `string` | `"allkeys-lru"` | no |
| `snapshot_retention_limit` | Snapshot retention days | `number` | `1` | no |
| `snapshot_window` | Snapshot time window | `string` | `"03:00-04:00"` | no |
| `maintenance_window` | Maintenance time window | `string` | `"sun:05:00-sun:06:00"` | no |
| `log_retention_days` | CloudWatch log retention | `number` | `14` | no |
| `sns_alarm_topic_arns` | SNS topics for alarms | `list(string)` | `[]` | no |
| `cpu_alarm_threshold` | CPU alarm threshold (%) | `number` | `80` | no |
| `memory_alarm_threshold` | Memory alarm threshold (%) | `number` | `80` | no |
| `connections_alarm_threshold` | Connections alarm threshold | `number` | `500` | no |
| `evictions_alarm_threshold` | Evictions alarm threshold | `number` | `100` | no |

## Outputs

| Name | Description |
|---|---|
| `replication_group_id` | Replication group ID |
| `primary_endpoint_address` | Primary (write) endpoint |
| `reader_endpoint_address` | Reader endpoint |
| `port` | Redis port (6379) |
| `security_group_id` | Redis SG ID |
| `subnet_group_name` | Subnet group name |
| `parameter_group_name` | Parameter group name |
| `auth_token_secret_arn` | Secrets Manager ARN |
| `slow_log_group_name` | Slow log group name |
| `engine_log_group_name` | Engine log group name |
| `cpu_alarm_arn` | CPU alarm ARN |
| `memory_alarm_arn` | Memory alarm ARN |
| `connections_alarm_arn` | Connections alarm ARN |
| `evictions_alarm_arn` | Evictions alarm ARN |

## Security Notes

- Transit encryption (`TLS`) is always enabled
- At-rest encryption is always enabled
- AUTH token is stored in Secrets Manager; access it via `auth_token_secret_arn`
- Inbound access is restricted to explicitly listed security groups only
- `apply_immediately` is `false` in production to prevent disruption during maintenance windows