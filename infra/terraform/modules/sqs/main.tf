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

locals {
  worker_queues = {
    crawl = {
      name                       = "knowledge-crawl-queue"
      dlq_name                   = "knowledge-crawl-dlq"
      visibility_timeout_seconds = 360
      max_receive_count          = 3
    }
    schema = {
      name                       = "schema-generation-queue"
      dlq_name                   = "schema-generation-dlq"
      visibility_timeout_seconds = 180
      max_receive_count          = 3
    }
    document_indexing = {
      name                       = "knowledge-document-indexing-queue"
      dlq_name                   = "knowledge-document-indexing-dlq"
      visibility_timeout_seconds = 180
      max_receive_count          = 3
    }
    document_status = {
      name                       = "knowledge-document-status-queue"
      dlq_name                   = "knowledge-document-status-dlq"
      visibility_timeout_seconds = 60
      max_receive_count          = 5
    }
    memory = {
      name                       = "agent-memory-queue"
      dlq_name                   = "agent-memory-dlq"
      visibility_timeout_seconds = 120
      max_receive_count          = 3
    }
  }
}

resource "aws_sqs_queue" "worker_dlq" {
  for_each                  = local.worker_queues
  name                      = "${var.project_name}-${each.value.dlq_name}-${var.environment}"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "worker_queue" {
  for_each                   = local.worker_queues
  name                       = "${var.project_name}-${each.value.name}-${var.environment}"
  visibility_timeout_seconds = each.value.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  receive_wait_time_seconds  = 20
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.worker_dlq[each.key].arn
    maxReceiveCount     = each.value.max_receive_count
  })
}

resource "aws_sqs_queue_redrive_allow_policy" "worker_dlq_allow" {
  for_each  = local.worker_queues
  queue_url = aws_sqs_queue.worker_dlq[each.key].id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.worker_queue[each.key].arn]
  })
}
