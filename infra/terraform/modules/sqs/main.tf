resource "aws_sqs_queue" "email_dlq" {
  name                      = "${var.project_name}-email-dlq-${var.environment}"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "email_queue" {
  name                       = "${var.project_name}-email-queue-${var.environment}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.email_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })
}

resource "aws_sqs_queue_redrive_allow_policy" "email_dlq_allow" {
  queue_url = aws_sqs_queue.email_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.email_queue.arn]
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_sqs_queue" "sms_dlq" {
  name                      = "${var.project_name}-sms-dlq-${var.environment}"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "sms_queue" {
  name                       = "${var.project_name}-sms-queue-${var.environment}"
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.sms_dlq.arn
    maxReceiveCount     = var.max_receive_count
  })
}

resource "aws_sqs_queue_redrive_allow_policy" "sms_dlq_allow" {
  queue_url = aws_sqs_queue.sms_dlq.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.sms_queue.arn]
  })
}
