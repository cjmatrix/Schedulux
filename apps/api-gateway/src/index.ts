import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
  });

  app.use(cookieParser());

  const PORT = process.env.PORT || 5000;
  await app.listen(PORT);
  console.log(`[API-GATEWAY] routing traffic live on http://localhost:${PORT}`);
}

bootstrap().catch(err => {
  console.error("Gateway startup failed:", err);
  process.exit(1);
});
