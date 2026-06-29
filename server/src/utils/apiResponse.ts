import { Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T | null = null,
  statusCode: number = HTTP_STATUS.OK
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    errors: null,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = HTTP_STATUS.BAD_REQUEST,
  errors: Record<string, string[]> | null = null
): Response {
  const response: ApiResponse<null> = {
    success: false,
    message,
    data: null,
    errors,
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, message: string, data: T): Response {
  return sendSuccess(res, message, data, HTTP_STATUS.CREATED);
}

export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}
