import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { MongoServerError } from 'mongodb';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import { config } from '../config';

export function notFoundHandler(req: Request, res: Response): Response {
  return sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND
  );
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error:', err);
    }
    return sendError(res, err.message, err.statusCode, err.fieldErrors);
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(e.message);
    });
    return sendError(res, ERROR_MESSAGES.VALIDATION_FAILED, HTTP_STATUS.UNPROCESSABLE_ENTITY, fieldErrors);
  }

  if (err instanceof TokenExpiredError) {
    return sendError(res, ERROR_MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
  }

  if (err instanceof JsonWebTokenError) {
    return sendError(res, ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return sendError(
      res,
      `Duplicate value for ${field}`,
      HTTP_STATUS.CONFLICT
    );
  }

  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
  });

  const message = config.NODE_ENV === 'production'
    ? ERROR_MESSAGES.INTERNAL_ERROR
    : err.message;

  return sendError(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}
