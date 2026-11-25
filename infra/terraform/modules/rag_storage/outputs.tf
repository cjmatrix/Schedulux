output "bucket_name" {
  value       = aws_s3_bucket.uploads.id
  description = "S3 bucket name for RAG PDF uploads"
}

output "bucket_arn" {
  value       = aws_s3_bucket.uploads.arn
  description = "S3 bucket ARN for RAG PDF uploads"
}
