terraform {
  backend "s3" {
    bucket         = "lomash-wood-terraform-state-dev"
    key            = "envs/dev/terraform.tfstate"
    region         = "eu-west-1"
    encrypt        = true
    dynamodb_table = "lomash-wood-terraform-locks-dev"
  }
}
