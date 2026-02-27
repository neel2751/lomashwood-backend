output "db_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "ARN of the RDS instance"
  value       = aws_db_instance.main.arn
}

output "db_instance_identifier" {
  description = "Identifier of the RDS instance"
  value       = aws_db_instance.main.identifier
}

output "db_instance_address" {
  description = "Hostname of the RDS instance"
  value       = aws_db_instance.main.address
}

output "db_instance_endpoint" {
  description = "Connection endpoint of the RDS instance (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.main.port
}

output "db_instance_name" {
  description = "Name of the default database"
  value       = aws_db_instance.main.db_name
}

output "db_instance_username" {
  description = "Master username of the RDS instance"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_instance_class" {
  description = "Instance class of the RDS instance"
  value       = aws_db_instance.main.instance_class
}

output "db_instance_engine_version" {
  description = "Engine version of the RDS instance"
  value       = aws_db_instance.main.engine_version_actual
}

output "db_instance_multi_az" {
  description = "Whether the RDS instance is Multi-AZ"
  value       = aws_db_instance.main.multi_az
}

output "db_instance_availability_zone" {
  description = "Availability zone of the RDS instance"
  value       = aws_db_instance.main.availability_zone
}

output "db_instance_hosted_zone_id" {
  description = "Canonical hosted zone ID of the RDS instance"
  value       = aws_db_instance.main.hosted_zone_id
}

output "db_instance_resource_id" {
  description = "RDS resource ID (used for IAM authentication)"
  value       = aws_db_instance.main.resource_id
}

output "db_parameter_group_name" {
  description = "Name of the DB parameter group"
  value       = aws_db_parameter_group.main.name
}

output "db_option_group_name" {
  description = "Name of the DB option group"
  value       = aws_db_option_group.main.name
}

output "read_replica_ids" {
  description = "List of read replica RDS instance IDs"
  value       = aws_db_instance.read_replica[*].id
}

output "read_replica_addresses" {
  description = "List of read replica hostnames"
  value       = aws_db_instance.read_replica[*].address
}

output "read_replica_endpoints" {
  description = "List of read replica connection endpoints (host:port)"
  value       = aws_db_instance.read_replica[*].endpoint
}

output "master_credentials_secret_arn" {
  description = "ARN of the Secrets Manager secret containing master DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "master_credentials_secret_name" {
  description = "Name of the Secrets Manager secret containing master DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "enhanced_monitoring_role_arn" {
  description = "ARN of the IAM role used for RDS enhanced monitoring"
  value       = var.monitoring_interval > 0 ? aws_iam_role.enhanced_monitoring[0].arn : null
}
