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

output "worker_sqs_queue_urls" {
  value       = module.sqs.worker_queue_urls
  description = "Map of SQS queue URLs for crawl, schema, document_indexing, document_status, and memory workers"
}

output "worker_sqs_queue_arns" {
  value       = module.sqs.worker_queue_arns
  description = "Map of SQS queue ARNs for worker queues"
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

# Frontend (S3 + CloudFront + ACM) Outputs
output "frontend_s3_bucket" {
  value       = module.frontend.s3_bucket_name
  description = "S3 bucket name for uploading apps/frontend-react/dist"
}

output "frontend_cloudfront_distribution_id" {
  value       = module.frontend.cloudfront_distribution_id
  description = "CloudFront Distribution ID for cache invalidation"
}

output "frontend_cloudfront_domain" {
  value       = module.frontend.cloudfront_domain_name
  description = "CloudFront domain (point GoDaddy CNAME 'app' to this)"
}

output "frontend_acm_validation_cnames" {
  value       = module.frontend.acm_validation_dns_records
  description = "CNAME record(s) to add in GoDaddy to validate the SSL certificate"
}

# RAG Storage Outputs
output "rag_s3_bucket" {
  value       = module.rag_storage.bucket_name
  description = "S3 bucket name for RAG PDF uploads"
}

output "rag_s3_bucket_arn" {
  value       = module.rag_storage.bucket_arn
  description = "S3 bucket ARN for RAG PDF uploads"
}
