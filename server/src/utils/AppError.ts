import { HTTP_STATUS } from '../constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly fieldErrors: Record<string, string[]> | null;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    fieldErrors: Record<string, string[]> | null = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
