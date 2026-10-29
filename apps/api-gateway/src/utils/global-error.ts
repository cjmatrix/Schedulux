import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';

const GRPC_TO_HTTP_STATUS: Record<number, number> = {
  1: 499, // CANCELLED
  2: HttpStatus.INTERNAL_SERVER_ERROR, // UNKNOWN
  3: HttpStatus.BAD_REQUEST, // INVALID_ARGUMENT
  4: HttpStatus.GATEWAY_TIMEOUT, // DEADLINE_EXCEEDED
  5: HttpStatus.NOT_FOUND, // NOT_FOUND
  6: HttpStatus.CONFLICT, // ALREADY_EXISTS
  7: HttpStatus.FORBIDDEN, // PERMISSION_DENIED
  8: HttpStatus.TOO_MANY_REQUESTS, // RESOURCE_EXHAUSTED
  9: HttpStatus.BAD_REQUEST, // FAILED_PRECONDITION
  10: HttpStatus.CONFLICT, // ABORTED
  11: HttpStatus.BAD_REQUEST, // OUT_OF_RANGE
  12: HttpStatus.NOT_IMPLEMENTED, // UNIMPLEMENTED
  13: HttpStatus.INTERNAL_SERVER_ERROR, // INTERNAL
  14: HttpStatus.SERVICE_UNAVAILABLE, // UNAVAILABLE
  15: HttpStatus.INTERNAL_SERVER_ERROR, // DATA_LOSS
  16: HttpStatus.UNAUTHORIZED, // UNAUTHENTICATED
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
    let message: unknown = RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (
      exception &&
      typeof exception === 'object' &&
      ('code' in exception || 'details' in exception)
    ) {
      const grpcErr = exception as GrpcError;
      if (typeof grpcErr.code === 'number' && GRPC_TO_HTTP_STATUS[grpcErr.code]) {
        status = GRPC_TO_HTTP_STATUS[grpcErr.code];
      } else {
        status = HttpStatus.BAD_REQUEST;
      }
      message = grpcErr.details || grpcErr.message || RESPONSE_MESSAGES.ERROR.MICROSERVICE_ERROR;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorDetails = typeof message === 'string' ? { error: message } : (message as object);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : exception;
      this._logger.error(`[${request.method} ${request.url}] status=${status}`, stack);
    } else {
      this._logger.warn(`[${request.method} ${request.url}] status=${status} error=${JSON.stringify(errorDetails)}`);
    }

    response.status(status).json({
      statusCode: status,
      ...errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

