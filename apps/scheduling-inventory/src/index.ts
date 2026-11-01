import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createRequire } from 'node:module';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import mongoose from 'mongoose';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { GrpcExceptionFilter } from './presentation/grpc/grpc-exception.filter.js';

const require = createRequire(import.meta.url);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    bufferLogs: true,
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:50053',
      package: 'scheduling',
      protoPath: require.resolve('@repo/proto/scheduling.proto'),
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

  app.useGlobalFilters(new GrpcExceptionFilter());

  const configService = app.get(ConfigService);

  logger.log('Connecting MongoDB for Scheduling & Inventory...', 'Bootstrap');
  const mongoUri = configService.get<string>('MONGO_URI');
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in scheduling-inventory configuration');
  }
  await mongoose.connect(mongoUri);
  logger.log('MongoDB connected for Scheduling & Inventory.', 'Bootstrap');

  await app.listen();
  logger.log('🚀 Scheduling & Inventory gRPC Microservice listening on port 50053', 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  process.stderr.write(`Scheduling & Inventory service startup failed: ${message}\n`);
  process.exit(1);
});
