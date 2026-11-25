output "instance_id" {
  value       = aws_instance.server.id
  description = "EC2 Instance ID"
}

output "public_ip" {
  value       = aws_eip.server.public_ip
  description = "Static Elastic IP attached to the EC2 instance"
}

output "public_dns" {
  value       = aws_eip.server.public_dns
  description = "Public DNS name of the Elastic IP"
}

output "private_key_path" {
  value       = local_sensitive_file.private_key.filename
  description = "Local path to the generated SSH private key (.pem)"
}

output "ssh_command" {
  value       = "ssh -i ${local_sensitive_file.private_key.filename} ubuntu@${aws_eip.server.public_ip}"
  description = "Ready-to-use SSH command to connect to the EC2 instance"
}
