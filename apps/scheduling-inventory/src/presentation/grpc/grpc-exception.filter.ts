import * as grpc from '@grpc/grpc-js';
import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class GrpcExceptionFilter implements RpcExceptionFilter<RpcException> {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: unknown, _host: ArgumentsHost): Observable<never> {
    let code: number = grpc.status.INTERNAL;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null && 'message' in response) {
        const respMsg = (response as { message: unknown }).message;
        message = Array.isArray(respMsg) ? respMsg.join(', ') : String(respMsg);
      } else {
        message = exception.message;
      }

      switch (status) {
        case HttpStatus.BAD_REQUEST:
          code = grpc.status.INVALID_ARGUMENT;
          break;
        case HttpStatus.UNAUTHORIZED:
          code = grpc.status.UNAUTHENTICATED;
          break;
        case HttpStatus.FORBIDDEN:
          code = grpc.status.PERMISSION_DENIED;
          break;
        case HttpStatus.NOT_FOUND:
          code = grpc.status.NOT_FOUND;
          break;
        case HttpStatus.CONFLICT:
          code = grpc.status.ALREADY_EXISTS;
          break;
        case HttpStatus.PRECONDITION_FAILED:
          code = grpc.status.FAILED_PRECONDITION;
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          code = grpc.status.RESOURCE_EXHAUSTED;
          break;
        case HttpStatus.UNPROCESSABLE_ENTITY:
          code = grpc.status.INVALID_ARGUMENT;
          break;
        default:
          code = grpc.status.INTERNAL;
          break;
      }

      this.logger.warn(`[gRPC HttpException] status=${status} code=${code} message="${message}"`);
    } else if (exception instanceof RpcException) {
      const err = exception.getError();
      if (typeof err === 'object' && err !== null) {
        code = (err as { code?: number }).code ?? grpc.status.INTERNAL;
        message = (err as { message?: string }).message ?? 'Microservice error';
      } else if (typeof err === 'string') {
        message = err;
      }
      this.logger.warn(`[gRPC RpcException] code=${code} message="${message}"`);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`[gRPC Unhandled Error] ${exception.message}`, exception.stack);
    } else {
      this.logger.error('[gRPC Unknown Error]', exception);
    }

    return throwError(() => ({
      code,
      message,
    }));
  }
}
