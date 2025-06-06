import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface APIError extends Error {
  statusCode?: number;
  details?: any;
}

export function createError(message: string, statusCode: number = 500, details?: any): APIError {
  const error = new Error(message) as APIError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function errorHandler(
  error: APIError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    });
  }

  // Handle API errors with custom status codes
  if ('statusCode' in error && error.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details && { details: error.details })
    });
  }

  // Handle database connection errors
  if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      message: 'Database temporarily unavailable. Please try again.'
    });
  }

  // Handle authentication errors
  if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  // Default server error
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}