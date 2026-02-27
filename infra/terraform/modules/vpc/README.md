# Terraform Module: VPC

Provisions a production-grade AWS VPC for the Lomash Wood backend infrastructure with public, private, and database subnet tiers across multiple Availability Zones.

## Resources Created

| Resource | Description |
|---|---|
| `aws_vpc` | Main VPC with DNS support and hostnames enabled |
| `aws_internet_gateway` | Internet Gateway attached to the VPC |
| `aws_subnet` (public) | Public subnets — one per AZ, auto-assign public IP |
| `aws_subnet` (private) | Private subnets — one per AZ for ECS tasks |
| `aws_subnet` (database) | Isolated database subnets — one per AZ |
| `aws_eip` | Elastic IPs for NAT Gateways |
| `aws_nat_gateway` | NAT Gateways in public subnets (per-AZ or single) |
| `aws_route_table` | Separate route tables per subnet tier |
| `aws_route_table_association` | Subnet-to-route-table associations |
| `aws_db_subnet_group` | RDS subnet group across database subnets |
| `aws_elasticache_subnet_group` | ElastiCache subnet group across database subnets |
| `aws_security_group` (alb) | ALB — allows HTTP/HTTPS from 0.0.0.0/0 |
| `aws_security_group` (ecs_tasks) | ECS tasks — allows traffic from ALB + self |
| `aws_security_group` (rds) | RDS — allows port 5432 from ECS tasks only |
| `aws_security_group` (redis) | Redis — allows port 6379 from ECS tasks only |
| `aws_flow_log` | VPC flow logs to CloudWatch (optional) |
| `aws_cloudwatch_log_group` | Log group for flow logs |
| `aws_iam_role` + `aws_iam_role_policy` | IAM for flow log delivery |

## Usage

```hcl
module "vpc" {
  source = "../../modules/vpc"

  project     = "lomash-wood"
  environment = "production"

  vpc_cidr = "10.0.0.0/16"

  availability_zones = [
    "eu-west-2a",
    "eu-west-2b",
    "eu-west-2c"
  ]

  public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  enable_nat_gateway  = true
  single_nat_gateway  = false

  enable_flow_logs        = true
  flow_log_retention_days = 30

  tags = {
    Project     = "lomash-wood"
    Environment = "production"
    ManagedBy   = "terraform"
    Team        = "platform"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| `project` | Project name prefix | `string` | — | yes |
| `environment` | Deployment environment | `string` | — | yes |
| `vpc_cidr` | VPC CIDR block | `string` | `10.0.0.0/16` | no |
| `availability_zones` | List of AZs (min 2) | `list(string)` | — | yes |
| `public_subnet_cidrs` | Public subnet CIDRs | `list(string)` | `[]` | no |
| `private_subnet_cidrs` | Private subnet CIDRs | `list(string)` | `[]` | no |
| `database_subnet_cidrs` | Database subnet CIDRs | `list(string)` | `[]` | no |
| `enable_nat_gateway` | Enable NAT Gateways | `bool` | `true` | no |
| `single_nat_gateway` | Single NAT Gateway (dev cost saving) | `bool` | `false` | no |
| `enable_flow_logs` | Enable VPC flow logs | `bool` | `true` | no |
| `flow_log_retention_days` | CloudWatch log retention | `number` | `30` | no |
| `tags` | Common resource tags | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|---|---|
| `vpc_id` | VPC ID |
| `vpc_cidr` | VPC CIDR block |
| `public_subnet_ids` | Public subnet IDs |
| `private_subnet_ids` | Private subnet IDs |
| `database_subnet_ids` | Database subnet IDs |
| `nat_gateway_ids` | NAT Gateway IDs |
| `nat_public_ips` | NAT Gateway public IPs |
| `alb_security_group_id` | ALB security group ID |
| `ecs_tasks_security_group_id` | ECS tasks security group ID |
| `rds_security_group_id` | RDS security group ID |
| `redis_security_group_id` | Redis security group ID |
| `db_subnet_group_name` | RDS DB subnet group name |
| `elasticache_subnet_group_name` | ElastiCache subnet group name |
| `flow_log_cloudwatch_log_group_name` | Flow logs CloudWatch log group |

## Subnet Architecture

```
VPC (10.0.0.0/16)
├── Public Subnets      (10.0.1-3.0/24)   → Internet Gateway → 0.0.0.0/0
├── Private Subnets     (10.0.11-13.0/24)  → NAT Gateway     → 0.0.0.0/0
└── Database Subnets    (10.0.21-23.0/24)  → No outbound route (isolated)
```

## Notes

- Set `single_nat_gateway = true` in dev/staging to reduce NAT Gateway costs
- Database subnets have no default outbound route — fully isolated
- Security groups follow least-privilege: RDS only accepts from ECS tasks, Redis only accepts from ECS tasks
- Flow logs capture ALL traffic (ACCEPT + REJECT) for security auditing