import 'reflect-metadata';
import { createRequire } from 'node:module';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import mongoose from 'mongoose';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

const require = createRequire(import.meta.url);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:50051',
      package: ['tenant', 'superadmin', 'dashboard'],
      protoPath: [
        require.resolve('@repo/proto/tenant.proto'),
        require.resolve('@repo/proto/superadmin.proto'),
        require.resolve('@repo/proto/dashboard.proto'),
      ],
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);

  logger.log('Connecting MongoDB...', 'Bootstrap');
  const mongoUri = configService.get<string>('MONGO_URI');
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    logger.log('MongoDB connected globally.', 'Bootstrap');
  } else {
    throw new Error('MONGO_URI is missing');
  }

  await app.listen();

  logger.log('gRPC Microservice listening on port 50051', 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  process.stderr.write(`Service startup failed: ${message}\n`);
  process.exit(1);
});
