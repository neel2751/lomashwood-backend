output "cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "task_execution_role_arn" {
  description = "ARN of the ECS task execution IAM role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "task_execution_role_name" {
  description = "Name of the ECS task execution IAM role"
  value       = aws_iam_role.ecs_task_execution.name
}

output "task_role_arn" {
  description = "ARN of the ECS task IAM role"
  value       = aws_iam_role.ecs_task.arn
}

output "task_role_name" {
  description = "Name of the ECS task IAM role"
  value       = aws_iam_role.ecs_task.name
}

output "service_ids" {
  description = "Map of service name to ECS service ID"
  value       = { for k, v in aws_ecs_service.services : k => v.id }
}

output "service_names" {
  description = "Map of service name to ECS service name"
  value       = { for k, v in aws_ecs_service.services : k => v.name }
}

output "service_arns" {
  description = "Map of service name to ECS service ARN"
  value       = { for k, v in aws_ecs_service.services : k => v.cluster }
}

output "task_definition_arns" {
  description = "Map of service name to task definition ARN"
  value       = { for k, v in aws_ecs_task_definition.services : k => v.arn }
}

output "task_definition_families" {
  description = "Map of service name to task definition family"
  value       = { for k, v in aws_ecs_task_definition.services : k => v.family }
}

output "task_definition_revisions" {
  description = "Map of service name to task definition revision"
  value       = { for k, v in aws_ecs_task_definition.services : k => v.revision }
}

output "cloudwatch_log_group_names" {
  description = "Map of service name to CloudWatch log group name"
  value       = { for k, v in aws_cloudwatch_log_group.services : k => v.name }
}

output "cloudwatch_log_group_arns" {
  description = "Map of service name to CloudWatch log group ARN"
  value       = { for k, v in aws_cloudwatch_log_group.services : k => v.arn }
}

output "autoscaling_target_resource_ids" {
  description = "Map of service name to App Auto Scaling resource ID"
  value       = { for k, v in aws_appautoscaling_target.services : k => v.resource_id }
}
