variable "project_name" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "instance_type" {
  type        = string
  default     = "c7i-flex.large"
  description = "EC2 instance type"
}

variable "root_volume_size" {
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
