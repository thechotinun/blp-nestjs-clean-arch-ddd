import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { DomainErrorType, DomainException } from '../../domain/index.js';
import type { ApiErrorResponse } from './api-response.js';
import { toResponseStatus } from './api-response.interceptor.js';

const DOMAIN_ERROR_STATUS: Record<DomainErrorType, HttpStatus> = {
  [DomainErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [DomainErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [DomainErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [DomainErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorType.CONFLICT]: HttpStatus.CONFLICT,
  [DomainErrorType.BUSINESS_RULE]: HttpStatus.UNPROCESSABLE_ENTITY,
};

/**
 * Converts every thrown error into the API error envelope.
 * Non-domain errors fall back to `error.code` = HTTP status and `error.message` = UPPER_SNAKE status text.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, body } = this.toErrorResponse(exception);

    response.status(statusCode).json(body);
  }

  private toErrorResponse(exception: unknown): {
    statusCode: number;
    body: ApiErrorResponse;
  } {
    if (exception instanceof DomainException) {
      const statusCode = DOMAIN_ERROR_STATUS[exception.type];
      return {
        statusCode,
        body: {
          status: toResponseStatus(statusCode),
          error: {
            code: exception.code,
            message: exception.message,
            errors: exception.errors,
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'object' && res !== null && 'message' in res
          ? res.message
          : undefined;

      return {
        statusCode,
        body: {
          status: toResponseStatus(statusCode),
          error: {
            code: statusCode,
            message: toErrorKey(statusCode),
            // ValidationPipe puts its messages here as string[].
            errors: Array.isArray(message) ? message : [],
          },
        },
      };
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    return {
      statusCode,
      body: {
        status: toResponseStatus(statusCode),
        error: {
          code: statusCode,
          message: toErrorKey(statusCode),
          errors: [],
        },
      },
    };
  }
}

function toErrorKey(statusCode: number): string {
  return (STATUS_CODES[statusCode] ?? 'Error')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');
}
