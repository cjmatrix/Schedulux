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
import { AppModule } from './app.module.js';

const require = createRequire(import.meta.url);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
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

  const configService = app.get(ConfigService);

  console.log('Connecting MongoDB for Scheduling & Inventory...');
  const mongoUri = configService.get<string>('MONGO_URI');
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in scheduling-inventory configuration');
  }
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected for Scheduling & Inventory.');

  await app.listen();
  console.log('🚀 Scheduling & Inventory gRPC Microservice listening on port 50053');
}

bootstrap().catch((err) => {
  console.error('Scheduling & Inventory service startup failed:', err);
  process.exit(1);
});
