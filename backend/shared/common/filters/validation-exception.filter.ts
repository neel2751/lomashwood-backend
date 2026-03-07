import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: exceptionResponse,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(400).json(errorResponse);
  }
}
