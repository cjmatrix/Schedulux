import "reflect-metadata";
import { createRequire } from "node:module";
import { NestFactory } from "@nestjs/core";
import { Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module.js";
import { ConfigService } from "@nestjs/config";
import mongoose from "mongoose";
const require = createRequire(import.meta.url);
async function bootstrap() {
    const app = await NestFactory.createMicroservice(AppModule, {
        transport: Transport.GRPC,
        options: {
            url: "0.0.0.0:50051",
            package: ["tenant", "superadmin", "dashboard", "knowledge"],
            protoPath: [
                require.resolve("@repo/proto/tenant.proto"),
                require.resolve("@repo/proto/superadmin.proto"),
                require.resolve("@repo/proto/dashboard.proto"),
                require.resolve("@repo/proto/knowledge.proto"),
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
    console.log("Connecting MongoDB...");
    const mongoUri = configService.get("MONGO_URI");
    if (mongoUri) {
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected globally.");
    }
    else {
        throw new Error("MONGO_URI is missing");
    }
    await app.listen();
    console.log(` gRPC Microservice listening on port 50051`);
}
bootstrap().catch((err) => {
    console.error(" Service startup failed:", err);
    process.exit(1);
});
