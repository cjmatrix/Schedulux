"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const global_error_js_1 = require("./utils/global-error.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'],
        credentials: true,
    });
    app.use((0, cookie_parser_1.default)());
    const PORT = process.env.PORT || 5000;
    app.useGlobalFilters(new global_error_js_1.GlobalExceptionFilter());
    await app.listen(PORT);
    console.log(`[API-GATEWAY] routing traffic live on http://localhost:${PORT}`);
}
bootstrap().catch(err => {
    console.error("Gateway startup failed:", err);
    process.exit(1);
});
