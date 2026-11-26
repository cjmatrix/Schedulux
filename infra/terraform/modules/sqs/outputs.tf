output "queue_url" {
  value = aws_sqs_queue.email_queue.url
}

output "queue_arn" {
  value = aws_sqs_queue.email_queue.arn
}

output "dlq_url" {
  value = aws_sqs_queue.email_dlq.url
}

output "dlq_arn" {
  value = aws_sqs_queue.email_dlq.arn
}

output "sms_queue_url" {
  value = aws_sqs_queue.sms_queue.url
}

output "sms_queue_arn" {
  value = aws_sqs_queue.sms_queue.arn
}

output "sms_dlq_url" {
  value = aws_sqs_queue.sms_dlq.url
}

output "sms_dlq_arn" {
  value = aws_sqs_queue.sms_dlq.arn
}

output "worker_queue_urls" {
  value = { for k, q in aws_sqs_queue.worker_queue : k => q.url }
}

output "worker_queue_arns" {
  value = { for k, q in aws_sqs_queue.worker_queue : k => q.arn }
}

output "worker_dlq_urls" {
  value = { for k, q in aws_sqs_queue.worker_dlq : k => q.url }
}
