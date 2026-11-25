output "function_arn" {
  value = aws_lambda_function.email_worker.arn
}

output "function_name" {
  value = aws_lambda_function.email_worker.function_name
}
