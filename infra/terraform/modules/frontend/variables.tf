variable "project_name" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "domain_name" {
  type        = string
  default     = "app.schedulux.xyz"
  description = "Custom domain for the React SPA and widget.js"
}

variable "enable_custom_domain" {
  type        = bool
  default     = false
  description = "Set true AFTER adding the ACM validation CNAME in GoDaddy to attach app.schedulux.xyz + SSL cert to CloudFront"
}

variable "price_class" {
  type        = string
  default     = "PriceClass_200"
  description = "CloudFront price class (PriceClass_200 includes India/Asia, US, Europe)"
}
