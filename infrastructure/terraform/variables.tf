variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "key_pair_name" {
  description = "AWS key pair name for EC2 access"
  type        = string
}

variable "hugging_face_token" {
  description = "Hugging Face API token"
  type        = string
  sensitive   = true
}