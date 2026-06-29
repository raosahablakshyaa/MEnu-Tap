import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config';
import routes from './routes';
import { setupSwagger } from './config/swagger';
import {
  globalRateLimiter,
  requestLogger,
  requestIdMiddleware,
  errorHandler,
  notFoundHandler,
} from './middlewares';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: config.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Restaurant-Id', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
}));

app.use(compression());
app.use(requestIdMiddleware);
app.use(requestLogger);
app.use(globalRateLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key "${key}" in request to ${req.path}`);
  },
}));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(config.API_PREFIX, routes);

setupSwagger(app);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
