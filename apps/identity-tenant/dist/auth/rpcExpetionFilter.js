var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Catch } from '@nestjs/common';
import { throwError } from 'rxjs';
import * as grpc from '@grpc/grpc-js';
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
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
            case 'USER_ALREADY_EXISTS':
                code = grpc.status.ALREADY_EXISTS;
                message = 'An account or user with this email already exists';
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
            case 'TENANT_NOT_FOUND':
                code = grpc.status.NOT_FOUND;
                message = 'Tenant not found';
                break;
            case 'ONLY_ACTIVE_TENANTS_CAN_BE_SUSPENDED':
                code = grpc.status.FAILED_PRECONDITION;
                message = 'Only active tenants can be suspended';
                break;
            default:
                console.error('Unhandled Microservice Error:', exception);
        }
        return throwError(() => ({ code, message }));
    }
};
AllExceptionsFilter = __decorate([
    Catch()
], AllExceptionsFilter);
export { AllExceptionsFilter };
