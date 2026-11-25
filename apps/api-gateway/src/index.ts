import './tracing.js';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './utils/global-error.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedOrigins = Array.from(
    new Set([
      ...envOrigins,
      'https://app.schedulux.xyz',
      'https://schedulux.xyz',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000',
    ]),
  );

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.use(cookieParser());

  const PORT = process.env.PORT || 5000;

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(PORT);
  console.log(`[API-GATEWAY] routing traffic live on http://localhost:${PORT}`);
}

bootstrap().catch((err) => {
  console.error('Gateway startup failed:', err);
  process.exit(1);
});
