variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "sms_queue_arn" {
  type = string
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

variable "batch_size" {
  type    = number
  default = 5
}
