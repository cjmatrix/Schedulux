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

# EC2 Server Outputs
output "ec2_instance_id" {
  value       = module.ec2.instance_id
  description = "ID of the provisioned EC2 instance"
}

output "ec2_public_ip" {
  value       = module.ec2.public_ip
  description = "Static Elastic IP attached to the EC2 instance"
}

output "ec2_ssh_command" {
  value       = module.ec2.ssh_command
  description = "Command to SSH into the EC2 instance"
}

output "ec2_private_key_path" {
  value       = module.ec2.private_key_path
  description = "Path to the generated SSH private key"
}
