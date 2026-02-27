output "replication_group_id" {
  description = "ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.redis.id
}

output "primary_endpoint_address" {
  description = "Address of the primary endpoint for write operations"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "Address of the reader endpoint for read operations"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "port" {
  description = "Port number on which the Redis cluster accepts connections"
  value       = 6379
}

output "security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.redis.name
}

output "parameter_group_name" {
  description = "Name of the ElastiCache parameter group"
  value       = aws_elasticache_parameter_group.redis.name
}

output "auth_token_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the Redis AUTH token and connection details"
  value       = aws_secretsmanager_secret.redis_auth_token.arn
}

output "slow_log_group_name" {
  description = "Name of the CloudWatch log group for Redis slow logs"
  value       = aws_cloudwatch_log_group.redis_slow_logs.name
}

output "engine_log_group_name" {
  description = "Name of the CloudWatch log group for Redis engine logs"
  value       = aws_cloudwatch_log_group.redis_engine_logs.name
}

output "cpu_alarm_arn" {
  description = "ARN of the CloudWatch alarm for Redis CPU utilization"
  value       = aws_cloudwatch_metric_alarm.redis_cpu.arn
}

output "memory_alarm_arn" {
  description = "ARN of the CloudWatch alarm for Redis memory usage"
  value       = aws_cloudwatch_metric_alarm.redis_memory.arn
}

output "connections_alarm_arn" {
  description = "ARN of the CloudWatch alarm for Redis connection count"
  value       = aws_cloudwatch_metric_alarm.redis_connections.arn
}

output "evictions_alarm_arn" {
  description = "ARN of the CloudWatch alarm for Redis evictions"
  value       = aws_cloudwatch_metric_alarm.redis_evictions.arn
}
