import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module.js";
import { ConfigService } from "@nestjs/config";
import mongoose from "mongoose";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: "0.0.0.0:50051",
        package: ["tenant", "superadmin"],
        protoPath: [
          join(__dirname, "./proto/tenant.proto"),
          join(__dirname, "./proto/superadmin.proto"),
        ],
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
        },
      },
    },
  );

  const configService = app.get(ConfigService);

  console.log("Connecting MongoDB...");
  const mongoUri = configService.get<string>("MONGO_URI");
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected globally.");
  } else {
    throw new Error("MONGO_URI is missing");
  }

  await app.listen();

  console.log(` gRPC Microservice listening on port 50051`);
}

bootstrap().catch((err) => {
  console.error(" Service startup failed:", err);
  process.exit(1);
});
