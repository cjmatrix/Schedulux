var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as grpc from '@grpc/grpc-js';
import { Catch } from '@nestjs/common';
import { throwError } from 'rxjs';
import { RESPONSE_MESSAGES } from '../constants/messages.constant.js';
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, _host) {
        let code = grpc.status.INTERNAL;
        let message = RESPONSE_MESSAGES.ERRORS.INTERNAL_SERVER_ERROR;
        const errMessage = exception instanceof Error
            ? exception.message
            : typeof exception === 'object' && exception !== null && 'message' in exception
                ? String(exception.message)
                : '';
        switch (errMessage) {
            case RESPONSE_MESSAGES.ERRORS.MISSING_REQUIRED_FIELDS:
            case RESPONSE_MESSAGES.ERRORS.EMAIL_AND_PASSWORD_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.VERIFICATION_TOKEN_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED_INPUT:
            case RESPONSE_MESSAGES.ERRORS.REFRESH_TOKEN_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.EMAIL_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.TENANT_ID_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.SUPERADMIN_ID_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.TOKEN_AND_NEW_PASSWORD_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.GOOGLE_ID_TOKEN_REQUIRED_INPUT:
            case RESPONSE_MESSAGES.ERRORS.GOOGLE_ID_TOKEN_REQUIRED:
            case RESPONSE_MESSAGES.ERRORS.USER_ID_REQUIRED:
                code = grpc.status.INVALID_ARGUMENT;
                message = errMessage;
                break;
            case RESPONSE_MESSAGES.ERRORS.EMAIL_ALREADY_EXISTS:
            case RESPONSE_MESSAGES.ERRORS.USER_ALREADY_EXISTS:
            case RESPONSE_MESSAGES.ERRORS.SUPERADMIN_ALREADY_EXISTS:
                code = grpc.status.ALREADY_EXISTS;
                message = RESPONSE_MESSAGES.ERRORS.ACCOUNT_ALREADY_EXISTS;
                break;
            case RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_TOKEN:
                code = grpc.status.INVALID_ARGUMENT;
                message = RESPONSE_MESSAGES.ERRORS.INVALID_VERIFICATION_TOKEN;
                break;
            case RESPONSE_MESSAGES.ERRORS.INVALID_CREDENTIALS:
                code = grpc.status.UNAUTHENTICATED;
                message = RESPONSE_MESSAGES.ERRORS.INVALID_EMAIL_OR_PASSWORD;
                break;
            case RESPONSE_MESSAGES.ERRORS.EMAIL_NOT_VERIFIED:
                code = grpc.status.PERMISSION_DENIED;
                message = RESPONSE_MESSAGES.ERRORS.VERIFY_EMAIL_PROMPT;
                break;
            case RESPONSE_MESSAGES.ERRORS.ACCOUNT_INACTIVE:
                code = grpc.status.PERMISSION_DENIED;
                message = RESPONSE_MESSAGES.ERRORS.ACCOUNT_INACTIVE_PROMPT;
                break;
            case RESPONSE_MESSAGES.ERRORS.INVALID_OR_EXPIRED_REFRESH_TOKEN:
            case RESPONSE_MESSAGES.ERRORS.INVALID_OR_REVOKED_REFRESH_TOKEN:
            case RESPONSE_MESSAGES.ERRORS.INVALID_REFRESH_TOKEN:
            case RESPONSE_MESSAGES.ERRORS.SUPERADMIN_NOT_FOUND:
            case RESPONSE_MESSAGES.ERRORS.USER_NOT_FOUND:
                code = grpc.status.UNAUTHENTICATED;
                message = RESPONSE_MESSAGES.ERRORS.SESSION_EXPIRED;
                break;
            case RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND:
            case RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND_OR_INACTIVE:
                code = grpc.status.NOT_FOUND;
                message = RESPONSE_MESSAGES.ERRORS.TENANT_NOT_FOUND_MSG;
                break;
            case RESPONSE_MESSAGES.ERRORS.ONLY_ACTIVE_TENANTS_CAN_BE_SUSPENDED:
                code = grpc.status.FAILED_PRECONDITION;
                message = RESPONSE_MESSAGES.ERRORS.ONLY_ACTIVE_TENANTS_CAN_BE_SUSPENDED_MSG;
                break;
            case RESPONSE_MESSAGES.ERRORS.CRAWL_JOB_NOT_FOUND:
                code = grpc.status.NOT_FOUND;
                message = RESPONSE_MESSAGES.ERRORS.CRAWL_JOB_NOT_FOUND_MSG;
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
