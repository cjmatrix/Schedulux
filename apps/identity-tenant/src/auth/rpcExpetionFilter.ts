
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import * as grpc from '@grpc/grpc-js';

@Catch()
export class AllExceptionsFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: any, host: ArgumentsHost){
    let code = grpc.status.INTERNAL;
    let message = 'Internal server error';
    switch (exception.message) {
      case 'Missing required fields':
      case 'Email and password are required':
      case 'Verification token is required':
      case 'Refresh token is required':
        code = grpc.status.INVALID_ARGUMENT;
        message = exception.message;
        break;
      case 'EMAIL_ALREADY_EXISTS':
        code = grpc.status.ALREADY_EXISTS;
        message = 'An account with this email already exists';
        break;
      case 'INVALID_OR_EXPIRED_TOKEN':
        code = grpc.status.INVALID_ARGUMENT;
        message = 'Invalid or expired verification token';
        break;
      case 'INVALID_CREDENTIALS':
        code = grpc.status.UNAUTHENTICATED;
        message = 'Invalid email or password';
        break;
      case 'EMAIL_NOT_VERIFIED':
        code = grpc.status.PERMISSION_DENIED;
        message = 'Please verify your email before logging in';
        break;
      case 'ACCOUNT_INACTIVE':
        code = grpc.status.PERMISSION_DENIED;
        message = 'Your account is not active. Please contact support.';
        break;
      case 'INVALID_OR_EXPIRED_REFRESH_TOKEN':
      case 'INVALID_OR_REVOKED_REFRESH_TOKEN':
      case 'SUPERADMIN_NOT_FOUND':
        code = grpc.status.UNAUTHENTICATED;
        message = 'Session expired or invalid. Please log in again.';
        break;
      default:
        console.error('Unhandled Microservice Error:', exception);
    }

    return throwError(() => ({ code, message }));
  }
}
