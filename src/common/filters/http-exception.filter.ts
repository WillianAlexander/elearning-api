import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import type { Response } from 'express';
import type { ApiResponse, ApiError } from '@lms/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errors: ApiError[] = this.extractErrors(exception);

    const body: ApiResponse<null> = {
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4(),
      },
      errors,
    };

    response.status(status).json(body);
  }

  private extractErrors(exception: unknown): ApiError[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return [{ code: 'HTTP_ERROR', message: response }];
      }
      if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, unknown>;
        if (Array.isArray(res['message'])) {
          return (res['message'] as string[]).map((msg) => ({
            code: 'VALIDATION_ERROR',
            message: msg,
          }));
        }
        return [
          {
            code: 'HTTP_ERROR',
            message: (res['message'] as string) ?? 'Unknown error',
          },
        ];
      }
    }

    return [
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    ];
  }
}
