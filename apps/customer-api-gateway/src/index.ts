import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './utils/global-error.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
     
      callback(null, origin || true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-agent-id', 'Accept'],
  });

  const PORT = process.env.PORT || 5001;

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(PORT);
  console.log(`[CUSTOMER-API-GATEWAY] routing public chat traffic live on http://localhost:${PORT}`);
}

bootstrap().catch((err) => {
  console.error('Customer Gateway startup failed:', err);
  process.exit(1);
});
