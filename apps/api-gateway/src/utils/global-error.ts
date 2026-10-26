import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

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

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (
      exception &&
      typeof exception === 'object' &&
      ('code' in exception || 'details' in exception)
    ) {
      if (typeof exception.code === 'number' && GRPC_TO_HTTP_STATUS[exception.code]) {
        status = GRPC_TO_HTTP_STATUS[exception.code];
      } else {
        status = HttpStatus.BAD_REQUEST;
      }
      message = exception.details || exception.message || 'Microservice error';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorDetails = typeof message === 'string' ? { error: message } : (message as object);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`[${request.method} ${request.url}] status=${status}`, exception?.stack || exception);
    } else {
      this.logger.warn(`[${request.method} ${request.url}] status=${status} error=${JSON.stringify(errorDetails)}`);
    }

    response.status(status).json({
      statusCode: status,
      ...errorDetails,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
