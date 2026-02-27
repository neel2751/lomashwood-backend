terraform {
  backend "s3" {
    bucket         = "lomash-wood-terraform-state-production"
    key            = "envs/production/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "lomash-wood-terraform-locks-production"
  }
}
