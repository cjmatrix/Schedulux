resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-sms-worker-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name = "${var.project_name}-sms-worker-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project_name}-sms-worker-${var.environment}*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.sms_queue_arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-sms-worker-${var.environment}"
  retention_in_days = 14
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/src/index.mjs"
  output_path = "${path.module}/build/lambda_sms.zip"
}

resource "aws_lambda_function" "sms_worker" {
  function_name    = "${var.project_name}-sms-worker-${var.environment}"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 15
  memory_size      = 256

  environment {
    variables = {
      TWILIO_ACCOUNT_SID           = var.twilio_account_sid
      TWILIO_AUTH_TOKEN            = var.twilio_auth_token
      TWILIO_FROM_PHONE            = var.twilio_from_phone
      TWILIO_MESSAGING_SERVICE_SID = var.twilio_messaging_service_sid
      DEFAULT_COUNTRY_CODE         = var.default_country_code
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_attach,
    aws_cloudwatch_log_group.lambda_logs
  ]
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn        = var.sms_queue_arn
  function_name           = aws_lambda_function.sms_worker.arn
  batch_size              = var.batch_size
  function_response_types = ["ReportBatchItemFailures"]
}
