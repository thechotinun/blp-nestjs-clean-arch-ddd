import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainErrorType, DomainException } from '../../domain/index.js';
import type { ApiErrorResponse } from './api-response.js';
import { toResponseStatus } from './api-response.interceptor.js';
import {
  ERROR_CODE_REGISTRY,
  ErrorCodeRegistry,
  SystemErrorKey,
} from './error-code.registry.js';
import { RequestValidationException } from './validation.pipe.js';

const DOMAIN_ERROR_STATUS: Record<DomainErrorType, HttpStatus> = {
  [DomainErrorType.VALIDATION]: HttpStatus.BAD_REQUEST,
  [DomainErrorType.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [DomainErrorType.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [DomainErrorType.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [DomainErrorType.CONFLICT]: HttpStatus.CONFLICT,
  [DomainErrorType.BUSINESS_RULE]: HttpStatus.UNPROCESSABLE_ENTITY,
};

interface ResolvedError {
  statusCode: number;
  key: string;
  errors: unknown[];
}

/**
 * Converts every thrown error into the API error envelope.
 * `error.message` is the error key; `error.code` comes from the app error catalog.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @Inject(ERROR_CODE_REGISTRY) private readonly registry: ErrorCodeRegistry,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { statusCode, key, errors } = this.resolve(exception);

    response.status(statusCode).json({
      status: toResponseStatus(statusCode),
      error: { code: this.codeOf(key), message: key, errors },
    } satisfies ApiErrorResponse);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof DomainException) {
      return {
        statusCode: DOMAIN_ERROR_STATUS[exception.type],
        key: exception.key,
        errors: exception.errors,
      };
    }

    if (exception instanceof RequestValidationException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        key: SystemErrorKey.VALIDATE,
        errors: exception.messages,
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
        key: httpStatusKey(statusCode),
        errors: Array.isArray(message) ? message : [],
      };
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      key: SystemErrorKey.UNDEFINED,
      errors: [],
    };
  }

  private codeOf(key: string): number {
    const code = this.registry.codeOf(key);
    if (code !== undefined) return code;

    this.logger.warn(`Error key "${key}" is missing from the error catalog`);
    return this.registry.codeOf(SystemErrorKey.UNDEFINED) ?? 0;
  }
}

function httpStatusKey(statusCode: number): SystemErrorKey {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return SystemErrorKey.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
    case HttpStatus.FORBIDDEN:
      return SystemErrorKey.UNAUTHORIZED;
    default:
      return SystemErrorKey.UNDEFINED;
  }
}
