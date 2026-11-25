variable "aws_region" {
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  type        = string
  default     = "dev"
}

variable "project_name" {
  type        = string
  default     = "schedulux"
}

variable "from_email" {
  type        = string
  default     = "no-reply@schedulux.ai"
}

variable "frontend_url" {
  type        = string
  default     = "http://localhost:5173"
}

variable "monthly_budget_limit" {
  type        = string
  default     = "30"
}

variable "budget_alert_email" {
  type        = string
  default     = "cjmartingarrix@gmail.com"
}

variable "twilio_account_sid" {
  type    = string
  default = ""
}

variable "twilio_auth_token" {
  type    = string
  default = ""
}

variable "twilio_from_phone" {
  type    = string
  default = ""
}

variable "twilio_messaging_service_sid" {
  type    = string
  default = ""
}

variable "default_country_code" {
  type    = string
  default = "+91"
}

# EC2 & Kubernetes Server Configuration
variable "ec2_instance_type" {
  type        = string
  default     = "c7i-flex.large"
  description = "EC2 instance type (default: c7i-flex.large - 2 vCPU, 4GB RAM)"
}

variable "ec2_root_volume_size" {
  type        = number
  default     = 40
  description = "Root GP3 EBS volume size in GB"
}

variable "ssh_cidr_blocks" {
  type        = list(string)
  default     = ["0.0.0.0/0"]
  description = "Allowed CIDR blocks for SSH access (port 22)"
}

variable "k8s_api_cidr_blocks" {
  type        = list(string)
  default     = ["0.0.0.0/0"]
  description = "Allowed CIDR blocks for remote kubectl access (port 6443)"
}

# Frontend (S3 + CloudFront + ACM) Configuration
variable "frontend_domain_name" {
  type        = string
  default     = "app.schedulux.xyz"
  description = "Custom domain for the React frontend + embeddable widget.js"
}

variable "enable_frontend_custom_domain" {
  type        = bool
  default     = false
  description = "Set true AFTER adding the ACM DNS validation CNAME in GoDaddy"
}

# RAG PDF Uploads S3 Bucket Configuration
variable "rag_s3_bucket_name" {
  type        = string
  default     = "my-client-pdf-uploads-mumbai"
  description = "S3 bucket name for client PDF uploads"
}

variable "rag_s3_allowed_origins" {
  type        = list(string)
  default     = ["https://app.schedulux.xyz", "https://schedulux.xyz", "http://localhost:5173"]
  description = "Allowed browser origins for presigned S3 PDF uploads"
}
