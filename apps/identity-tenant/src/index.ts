import 'reflect-metadata';
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

  const configService = app.get(ConfigService);

  console.log('Connecting MongoDB...');
  const mongoUri = configService.get<string>('MONGO_URI');
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected globally.');
  } else {
    throw new Error('MONGO_URI is missing');
  }

  await app.listen();

  console.log(` gRPC Microservice listening on port 50051`);
}

bootstrap().catch((err) => {
  console.error(' Service startup failed:', err);
  process.exit(1);
});
