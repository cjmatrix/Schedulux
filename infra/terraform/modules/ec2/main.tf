data "aws_vpc" "default" {
  default = true
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# Generate an RSA private key for SSH access
resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Register the public key with AWS
resource "aws_key_pair" "schedulux" {
  key_name   = "${var.project_name}-${var.environment}-key"
  public_key = tls_private_key.ssh.public_key_openssh
}

# Save the private key locally for easy SSH access
resource "local_sensitive_file" "private_key" {
  content         = tls_private_key.ssh.private_key_pem
  filename        = "${path.root}/${var.project_name}-${var.environment}-key.pem"
  file_permission = "0400"
}

# Security group allowing SSH, HTTP, HTTPS, and Kubernetes API
resource "aws_security_group" "k8s_server" {
  name        = "${var.project_name}-${var.environment}-sg"
  description = "Security group for Schedulux K3s Single Node EC2"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
  }

  # HTTP (ACME challenge & HTTP-to-HTTPS redirect)
  ingress {
    description = "HTTP - Lets Encrypt ACME and Traefik Web entrypoint"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS (Traefik TLS)
  ingress {
    description = "HTTPS - Traefik WebSecure entrypoint"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API (for remote kubectl)
  ingress {
    description = "Kubernetes API Server (k3s)"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = var.k8s_api_cidr_blocks
  }

  # Outbound internet access
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-sg"
  }
}

# EC2 Instance: c7i-flex.large
resource "aws_instance" "server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.schedulux.key_name

  vpc_security_group_ids = [aws_security_group.k8s_server.id]

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    iops                  = 3000
    throughput            = 125
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-${var.environment}-root-disk"
    }
  }

  user_data = <<-EOF
              #!/bin/bash
              set -e
              apt-get update -y
              apt-get install -y curl ufw htop jq git
              # Ensure UFW does not block container networking if enabled
              ufw allow 22/tcp
              ufw allow 80/tcp
              ufw allow 443/tcp
              ufw allow 6443/tcp
              EOF

  tags = {
    Name = "${var.project_name}-${var.environment}-server"
    Role = "k3s-control-plane"
  }
}

# Elastic IP allocation and association
resource "aws_eip" "server" {
  domain   = "vpc"
  instance = aws_instance.server.id

  tags = {
    Name = "${var.project_name}-${var.environment}-eip"
  }
}
