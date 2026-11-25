variable "project_name" {
  type        = string
  description = "Project name"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "bucket_name" {
  type        = string
  default     = "my-client-pdf-uploads-mumbai"
  description = "S3 bucket name for RAG PDF uploads"
}

variable "allowed_origins" {
  type        = list(string)
  default     = ["https://app.schedulux.xyz", "https://schedulux.xyz", "http://localhost:5173"]
  description = "Browser origins permitted to upload PDFs via presigned S3 URLs"
}
