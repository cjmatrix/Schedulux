output "email_queue_url" {
  value = module.sqs.queue_url
}

output "email_queue_arn" {
  value = module.sqs.queue_arn
}

output "email_dlq_url" {
  value = module.sqs.dlq_url
}

output "email_dlq_arn" {
  value = module.sqs.dlq_arn
}

output "lambda_function_arn" {
  value = module.lambda_email.function_arn
}

output "lambda_function_name" {
  value = module.lambda_email.function_name
}

output "sms_queue_url" {
  value = module.sqs.sms_queue_url
}

output "sms_queue_arn" {
  value = module.sqs.sms_queue_arn
}

output "sms_dlq_url" {
  value = module.sqs.sms_dlq_url
}

output "sms_dlq_arn" {
  value = module.sqs.sms_dlq_arn
}

output "lambda_sms_function_arn" {
  value = module.lambda_sms.function_arn
}

output "lambda_sms_function_name" {
  value = module.lambda_sms.function_name
}
