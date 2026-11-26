module "sqs" {
  source = "./modules/sqs"

  project_name = var.project_name
  environment  = var.environment
}

module "lambda_email" {
  source = "./modules/lambda_email"

  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  email_queue_arn = module.sqs.queue_arn
  brevo_api_key   = var.brevo_api_key
  from_email      = var.from_email
  from_name       = var.from_name
  frontend_url    = var.frontend_url
}

module "lambda_sms" {
  source = "./modules/lambda_sms"

  project_name                 = var.project_name
  environment                  = var.environment
  aws_region                   = var.aws_region
  sms_queue_arn                = module.sqs.sms_queue_arn
  twilio_account_sid           = var.twilio_account_sid
  twilio_auth_token            = var.twilio_auth_token
  twilio_from_phone            = var.twilio_from_phone
  twilio_messaging_service_sid = var.twilio_messaging_service_sid
  default_country_code         = var.default_country_code
}

module "ec2" {
  source = "./modules/ec2"

  project_name        = var.project_name
  environment         = var.environment
  instance_type       = var.ec2_instance_type
  root_volume_size    = var.ec2_root_volume_size
  ssh_cidr_blocks     = var.ssh_cidr_blocks
  k8s_api_cidr_blocks = var.k8s_api_cidr_blocks
}

module "frontend" {
  source = "./modules/frontend"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project_name         = var.project_name
  environment          = var.environment
  domain_name          = var.frontend_domain_name
  enable_custom_domain = var.enable_frontend_custom_domain
}

module "rag_storage" {
  source = "./modules/rag_storage"

  project_name    = var.project_name
  environment     = var.environment
  bucket_name     = var.rag_s3_bucket_name
  allowed_origins = var.rag_s3_allowed_origins
}
