"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const messages_constant_js_1 = require("../constants/messages.constant.js");
const GRPC_TO_HTTP_STATUS = {
    1: 499, // CANCELLED
    2: common_1.HttpStatus.INTERNAL_SERVER_ERROR, // UNKNOWN
    3: common_1.HttpStatus.BAD_REQUEST, // INVALID_ARGUMENT
    4: common_1.HttpStatus.GATEWAY_TIMEOUT, // DEADLINE_EXCEEDED
    5: common_1.HttpStatus.NOT_FOUND, // NOT_FOUND
    6: common_1.HttpStatus.CONFLICT, // ALREADY_EXISTS
    7: common_1.HttpStatus.FORBIDDEN, // PERMISSION_DENIED
    8: common_1.HttpStatus.TOO_MANY_REQUESTS, // RESOURCE_EXHAUSTED
    9: common_1.HttpStatus.BAD_REQUEST, // FAILED_PRECONDITION
    10: common_1.HttpStatus.CONFLICT, // ABORTED
    11: common_1.HttpStatus.BAD_REQUEST, // OUT_OF_RANGE
    12: common_1.HttpStatus.NOT_IMPLEMENTED, // UNIMPLEMENTED
    13: common_1.HttpStatus.INTERNAL_SERVER_ERROR, // INTERNAL
    14: common_1.HttpStatus.SERVICE_UNAVAILABLE, // UNAVAILABLE
    15: common_1.HttpStatus.INTERNAL_SERVER_ERROR, // DATA_LOSS
    16: common_1.HttpStatus.UNAUTHORIZED, // UNAUTHENTICATED
};
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    _logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = messages_constant_js_1.RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            message = exception.getResponse();
        }
        else if (exception &&
            typeof exception === 'object' &&
            ('code' in exception || 'details' in exception)) {
            const grpcErr = exception;
            if (typeof grpcErr.code === 'number' && GRPC_TO_HTTP_STATUS[grpcErr.code]) {
                status = GRPC_TO_HTTP_STATUS[grpcErr.code];
            }
            else {
                status = common_1.HttpStatus.BAD_REQUEST;
            }
            message = grpcErr.details || grpcErr.message || messages_constant_js_1.RESPONSE_MESSAGES.ERROR.MICROSERVICE_ERROR;
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        const errorDetails = typeof message === 'string' ? { error: message } : message;
        if (status >= common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            const stack = exception instanceof Error ? exception.stack : exception;
            this._logger.error(`[${request.method} ${request.url}] status=${status}`, stack);
        }
        else {
            this._logger.warn(`[${request.method} ${request.url}] status=${status} error=${JSON.stringify(errorDetails)}`);
        }
        response.status(status).json({
            statusCode: status,
            ...errorDetails,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
