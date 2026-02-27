project     = "lomash-wood"
environment = "production"
aws_region  = "eu-west-1"

primary_domain = "lomashwood.co.uk"

vpc_cidr              = "10.2.0.0/16"
availability_zones    = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
public_subnet_cidrs   = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs  = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
database_subnet_cidrs = ["10.2.20.0/24", "10.2.21.0/24", "10.2.22.0/24"]

db_name     = "lomash_wood_production"
db_username = "lomash_app"

smtp_host         = "email-smtp.eu-west-1.amazonaws.com"
smtp_port         = 587
smtp_from_address = "no-reply@lomashwood.co.uk"

twilio_from_number = ""

cloudfront_domain_aliases = [
  "lomashwood.co.uk",
  "www.lomashwood.co.uk"
]

extra_certificate_arns = []

allowed_origins = [
  "https://lomashwood.co.uk",
  "https://www.lomashwood.co.uk"
]

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

kms_key_administrator_arns     = []
alert_email_endpoints          = []
critical_alert_email_endpoints = []

monthly_budget_limit_usd = "1000"

gtm_container_id       = ""
gsc_verification_token = ""
