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
