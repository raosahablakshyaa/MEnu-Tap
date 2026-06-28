import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger } from '../utils/logger';
import { config } from '../config';

const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

const skip = () => config.NODE_ENV === 'test';

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
