output "function_arn" {
  value = aws_lambda_function.sms_worker.arn
}

output "function_name" {
  value = aws_lambda_function.sms_worker.function_name
}
