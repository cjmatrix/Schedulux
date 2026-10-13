import 'reflect-metadata';
import { createRequire } from 'node:module';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';
const require = createRequire(import.meta.url);
async function bootstrap() {
    const app = await NestFactory.createMicroservice(AppModule, {
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
    const mongoUri = configService.get('MONGO_URI') || 'mongodb://localhost:27017/schedulux';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for Scheduling & Inventory.');
    await app.listen();
    console.log('🚀 Scheduling & Inventory gRPC Microservice listening on port 50053');
}
bootstrap().catch((err) => {
    console.error('Scheduling & Inventory service startup failed:', err);
    process.exit(1);
});
