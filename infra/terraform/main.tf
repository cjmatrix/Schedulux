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
  from_email      = var.from_email
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
