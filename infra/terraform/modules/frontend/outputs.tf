output "s3_bucket_name" {
  value       = aws_s3_bucket.frontend.id
  description = "Private S3 bucket name for uploading frontend-react/dist"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "CloudFront Distribution ID (used for cache invalidations)"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.frontend.domain_name
  description = "CloudFront domain (point GoDaddy CNAME for 'app' to this value)"
}

output "acm_validation_dns_records" {
  value = [
    for dvo in aws_acm_certificate.frontend.domain_validation_options : {
      domain = dvo.domain_name
      type   = dvo.resource_record_type
      name   = dvo.resource_record_name
      value  = dvo.resource_record_value
    }
  ]
  description = "Add this CNAME record in GoDaddy to validate the SSL certificate for app.schedulux.xyz"
}
