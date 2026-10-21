import 'dotenv/config';
import { createEmailWorker } from './workers/emailWorker.js';
console.log(' [Background Worker Service] Starting worker...');
let emailWorker = null;
async function bootstrap() {
    try {
        emailWorker = await createEmailWorker();
        console.log(' [Background Worker] Listening for jobs on RabbitMQ "email-queue"');
    }
    catch (err) {
        console.error(' [Background Worker] Failed to start email worker:', err);
        process.exit(1);
    }
}
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down worker...`);
    try {
        if (emailWorker) {
            await emailWorker.close();
        }
        console.log(' Worker closed. Exiting process.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
bootstrap();
