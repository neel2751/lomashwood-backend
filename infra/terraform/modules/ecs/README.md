# Terraform Module: ECS

Provisions a production-grade AWS ECS Fargate cluster with task definitions, services, IAM roles, CloudWatch logging, Application Auto Scaling, and CloudWatch alarms for all Lomash Wood backend microservices.

## Resources Created

| Resource | Description |
|---|---|
| `aws_ecs_cluster` | ECS cluster with optional Container Insights |
| `aws_ecs_cluster_capacity_providers` | FARGATE + FARGATE_SPOT capacity providers |
| `aws_iam_role` (execution) | Task execution role — ECR pull, secrets, logs |
| `aws_iam_role` (task) | Task role — S3, SES, Secrets Manager, X-Ray |
| `aws_iam_role_policy_attachment` | Attaches `AmazonECSTaskExecutionRolePolicy` |
| `aws_iam_role_policy` (execution) | Secrets Manager + SSM + KMS + CloudWatch Logs |
| `aws_iam_role_policy` (task) | S3, SES, Secrets Manager, X-Ray access |
| `aws_cloudwatch_log_group` | Per-service log groups with configurable retention |
| `aws_ecs_task_definition` | Fargate task definitions per service |
| `aws_ecs_service` | ECS Fargate services with circuit-breaker rollback |
| `aws_appautoscaling_target` | Auto Scaling targets per service (optional) |
| `aws_appautoscaling_policy` (cpu) | CPU-based target tracking scaling policy |
| `aws_appautoscaling_policy` (memory) | Memory-based target tracking scaling policy |
| `aws_cloudwatch_metric_alarm` (cpu) | Alarm when CPU > 85% for 2 periods |
| `aws_cloudwatch_metric_alarm` (memory) | Alarm when Memory > 90% for 2 periods |

## Usage

```hcl
module "ecs" {
  source = "../../modules/ecs"

  project     = "lomash-wood"
  environment = "production"
  aws_region  = "eu-west-2"

  private_subnet_ids          = module.vpc.private_subnet_ids
  ecs_tasks_security_group_id = module.vpc.ecs_tasks_security_group_id

  enable_container_insights = true
  enable_execute_command    = false
  log_retention_days        = 30

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  default_capacity_provider_strategy = [
    { capacity_provider = "FARGATE", weight = 1, base = 1 }
  ]

  alarm_sns_topic_arn = module.monitoring.alerts_sns_topic_arn

  services = [
    {
      name           = "api-gateway"
      image          = "123456789.dkr.ecr.eu-west-2.amazonaws.com/lomash-wood/api-gateway:latest"
      cpu            = 512
      memory         = 1024
      desired_count  = 2
      container_port = 3000
      target_group_arn = module.alb.api_gateway_target_group_arn
      environment = {
        NODE_ENV    = "production"
        PORT        = "3000"
        LOG_LEVEL   = "info"
      }
      secrets = {
        JWT_SECRET       = "arn:aws:secretsmanager:eu-west-2:123456789:secret:lomash-wood/production/jwt-secret"
        DATABASE_URL     = "arn:aws:secretsmanager:eu-west-2:123456789:secret:lomash-wood/production/db-url"
      }
      health_check = {
        command      = "curl -f http://localhost:3000/health || exit 1"
        interval     = 30
        timeout      = 5
        retries      = 3
        start_period = 60
      }
      autoscaling = {
        min_capacity       = 2
        max_capacity       = 10
        cpu_target         = 70
        memory_target      = 80
        scale_in_cooldown  = 300
        scale_out_cooldown = 60
      }
    },
    {
      name           = "auth-service"
      image          = "123456789.dkr.ecr.eu-west-2.amazonaws.com/lomash-wood/auth-service:latest"
      cpu            = 256
      memory         = 512
      desired_count  = 2
      container_port = 3001
      environment = {
        NODE_ENV = "production"
        PORT     = "3001"
      }
      secrets = {
        DATABASE_URL = "arn:aws:secretsmanager:eu-west-2:123456789:secret:lomash-wood/production/auth-db-url"
        REDIS_URL    = "arn:aws:secretsmanager:eu-west-2:123456789:secret:lomash-wood/production/redis-url"
      }
      health_check = {
        command = "curl -f http://localhost:3001/health || exit 1"
      }
      autoscaling = {
        min_capacity = 2
        max_capacity = 8
      }
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
| `aws_region` | AWS region | `string` | — | yes |
| `private_subnet_ids` | Private subnet IDs for ECS tasks | `list(string)` | — | yes |
| `ecs_tasks_security_group_id` | ECS tasks security group ID | `string` | — | yes |
| `capacity_providers` | ECS capacity providers | `list(string)` | `["FARGATE","FARGATE_SPOT"]` | no |
| `default_capacity_provider_strategy` | Default capacity strategy | `list(object)` | FARGATE base 1 | no |
| `enable_container_insights` | Enable Container Insights | `bool` | `true` | no |
| `enable_execute_command` | Enable ECS Exec | `bool` | `false` | no |
| `log_retention_days` | CloudWatch log retention | `number` | `30` | no |
| `service_names` | Service names for log groups | `list(string)` | All 9 services | no |
| `services` | ECS service definitions | `list(object)` | `[]` | no |
| `alarm_sns_topic_arn` | SNS topic ARN for alarms | `string` | `null` | no |
| `tags` | Common resource tags | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|---|---|
| `cluster_id` | ECS cluster ID |
| `cluster_name` | ECS cluster name |
| `cluster_arn` | ECS cluster ARN |
| `task_execution_role_arn` | Task execution IAM role ARN |
| `task_role_arn` | Task IAM role ARN |
| `service_ids` | Map of service name → ECS service ID |
| `service_names` | Map of service name → ECS service name |
| `task_definition_arns` | Map of service name → task definition ARN |
| `task_definition_revisions` | Map of service name → task definition revision |
| `cloudwatch_log_group_names` | Map of service name → log group name |
| `autoscaling_target_resource_ids` | Map of service name → auto scaling resource ID |

## Service Configuration

Each service in `var.services` supports:

| Field | Description | Required |
|---|---|---|
| `name` | Service identifier | yes |
| `image` | ECR image URI with tag | yes |
| `cpu` | Task CPU units (256/512/1024/2048/4096) | yes |
| `memory` | Task memory in MB | yes |
| `desired_count` | Number of running tasks | yes |
| `container_port` | Container port to expose | yes |
| `target_group_arn` | ALB target group ARN | no |
| `environment` | Non-sensitive environment variables | no |
| `secrets` | Secrets Manager ARNs for sensitive values | no |
| `health_check` | Container health check config | no |
| `autoscaling` | Auto scaling config (min/max/cpu/memory targets) | no |

## Notes

- All tasks run in `awsvpc` network mode on Fargate — no EC2 instances to manage
- Deployment circuit breaker is enabled with automatic rollback on failed deployments
- `lifecycle { ignore_changes = [desired_count, task_definition] }` prevents Terraform from overriding deployments made by CI/CD pipelines
- Enable `enable_execute_command = true` in dev/staging only for interactive container debugging
- Use `FARGATE_SPOT` in the capacity strategy for non-critical workloads to reduce costs by up to 70%