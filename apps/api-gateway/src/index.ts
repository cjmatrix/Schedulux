import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './utils/global-error.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
  });

  app.use(cookieParser());

  const PORT = process.env.PORT || 5000;

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(PORT);
  console.log(`[API-GATEWAY] routing traffic live on http://localhost:${PORT}`);
}

bootstrap().catch(err => {
  console.error("Gateway startup failed:", err);
  process.exit(1);
});
