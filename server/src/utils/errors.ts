import { AppError } from './AppError';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = ERROR_MESSAGES.VALIDATION_FAILED,
    public fieldErrors: Record<string, string[]> = {}
  ) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, fieldErrors);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}
