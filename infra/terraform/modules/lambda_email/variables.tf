variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "email_queue_arn" {
  type = string
}

variable "from_email" {
  type = string
}

variable "from_name" {
  type    = string
  default = "Schedulux AI"
}

variable "brevo_api_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "frontend_url" {
  type = string
}

variable "batch_size" {
  type    = number
  default = 5
}
