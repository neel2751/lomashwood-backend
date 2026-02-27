project     = "lomash-wood"
environment = "dev"
aws_region  = "eu-west-1"

vpc_cidr              = "10.0.0.0/16"
availability_zones    = ["eu-west-1a", "eu-west-1b"]
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs  = ["10.0.10.0/24", "10.0.11.0/24"]
database_subnet_cidrs = ["10.0.20.0/24", "10.0.21.0/24"]

db_name     = "lomash_wood_dev"
db_username = "lomash_app"

ecs_service_names = [
  "api-gateway",
  "auth-service",
  "product-service",
  "order-payment-service",
  "appointment-service",
  "content-service",
  "customer-service",
  "notification-service",
  "analytics-service"
]

smtp_host = "email-smtp.eu-west-1.amazonaws.com"
smtp_port = 587

cloudfront_domain_aliases = []

alert_email_endpoints = []

container_image_tag = "latest"
