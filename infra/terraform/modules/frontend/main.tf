terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  bucket_name = "${var.project_name}-${var.environment}-frontend-${data.aws_caller_identity.current.account_id}"
}

# 1. Private S3 Bucket for React SPA + widget.js
resource "aws_s3_bucket" "frontend" {
  bucket = local.bucket_name

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. ACM SSL Certificate in us-east-1 (Required by AWS CloudFront)
resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-cert"
  }
}

resource "aws_acm_certificate_validation" "frontend" {
  count           = var.enable_custom_domain ? 1 : 0
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.frontend.arn
}

# 3. CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-${var.environment}-frontend-oac"
  description                       = "OAC for Schedulux Frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 4. CloudFront Function for React SPA client-side routing
resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "${var.project_name}-${var.environment}-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite extensionless React Router paths to /index.html while keeping /widget.js and /assets/* intact"
  publish = true
  code    = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      if (!uri.includes('.')) {
        request.uri = '/index.html';
      }
      return request;
    }
  EOF
}

# 5. Cache & Response Headers Policies
resource "aws_cloudfront_cache_policy" "respect_s3_headers" {
  name        = "${var.project_name}-${var.environment}-frontend-cache"
  comment     = "Respects per-object S3 Cache-Control (no-cache for index.html, 5m for widget.js, 1y for hashed assets)"
  min_ttl     = 0
  default_ttl = 300
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_response_headers_policy" "widget_cors" {
  name    = "${var.project_name}-${var.environment}-widget-cors"
  comment = "Allow any customer website to load widget.js cleanly"

  cors_config {
    access_control_allow_credentials = false

    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = ["*"]
    }

    origin_override = true
  }
}

# 6. CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  price_class         = var.price_class
  default_root_object = "index.html"
  comment             = "Schedulux Frontend React App + Chat Widget CDN"

  aliases = var.enable_custom_domain ? [var.domain_name] : []

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Dedicated behavior for /widget.js with CORS headers (no SPA index.html rewrite)
  ordered_cache_behavior {
    path_pattern               = "/widget.js"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-frontend"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.respect_s3_headers.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.widget_cors.id
  }

  # Default behavior for React SPA + hashed assets
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = aws_cloudfront_cache_policy.respect_s3_headers.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = !var.enable_custom_domain
    acm_certificate_arn            = var.enable_custom_domain ? aws_acm_certificate_validation.frontend[0].certificate_arn : null
    ssl_support_method             = var.enable_custom_domain ? "sni-only" : null
    minimum_protocol_version       = var.enable_custom_domain ? "TLSv1.2_2021" : "TLSv1"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-cdn"
  }
}

# 7. S3 Bucket Policy granting read access ONLY to this CloudFront distribution
data "aws_iam_policy_document" "frontend_s3_policy" {
  statement {
    sid     = "AllowCloudFrontServicePrincipalReadOnly"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_s3_policy.json
}
