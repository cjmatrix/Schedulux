import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const GRPC_TO_HTTP_STATUS: Record<number, number> = {
  1: 499,
  2: HttpStatus.INTERNAL_SERVER_ERROR,
  3: HttpStatus.BAD_REQUEST,
  4: HttpStatus.GATEWAY_TIMEOUT,
  5: HttpStatus.NOT_FOUND,
  6: HttpStatus.CONFLICT,
  7: HttpStatus.FORBIDDEN,
  8: HttpStatus.TOO_MANY_REQUESTS,
  9: HttpStatus.BAD_REQUEST,
  10: HttpStatus.CONFLICT,
  11: HttpStatus.BAD_REQUEST,
  12: HttpStatus.NOT_IMPLEMENTED,
  13: HttpStatus.INTERNAL_SERVER_ERROR,
  14: HttpStatus.SERVICE_UNAVAILABLE,
  15: HttpStatus.INTERNAL_SERVER_ERROR,
  16: HttpStatus.UNAUTHORIZED,
};

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly _logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (
      exception &&
      typeof exception === 'object' &&
      ('code' in exception || 'details' in exception)
    ) {
      const grpcErr = exception as GrpcError;
      if (grpcErr.code !== undefined && GRPC_TO_HTTP_STATUS[grpcErr.code]) {
        status = GRPC_TO_HTTP_STATUS[grpcErr.code];
        message = grpcErr.details || grpcErr.message || 'Service communication error';
      }
    } else if (exception instanceof Error) {
      this._logger.error(`Unexpected exception: ${exception.message}`, exception.stack);
      message = exception.message;
    }

    let errorMessage = message;
    let errorDetails: unknown = null;

    if (typeof message === 'object' && message !== null) {
      const msgObj = message as Record<string, unknown>;
      errorMessage = msgObj.message || msgObj.error || errorMessage;
      if (msgObj.message && msgObj.error) {
        errorDetails = msgObj.message;
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
