import 'dotenv/config';
import { startBookingEventsConsumer, } from './consumers/bookingEventsConsumer.js';
import { createEmailWorker } from './workers/emailWorker.js';
import { createSmsWorker } from './workers/smsWorker.js';
console.log(' [Background Worker Service] Starting workers & consumers...');
let emailWorker = null;
let smsWorker = null;
let bookingEventsConsumer = null;
async function bootstrap() {
    try {
        emailWorker = await createEmailWorker();
        console.log(' [Background Worker] Listening for jobs on RabbitMQ "email-queue"');
        smsWorker = await createSmsWorker();
        console.log(' [Background Worker] Listening for jobs on RabbitMQ "sms-queue"');
        bookingEventsConsumer = await startBookingEventsConsumer();
        if (bookingEventsConsumer) {
            console.log(' [Background Worker] Listening for domain events on Kafka "scheduling.booking.events"');
        }
    }
    catch (err) {
        console.error(' [Background Worker] Failed to start workers:', err);
        process.exit(1);
    }
}
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down workers...`);
    try {
        const shutdowns = [];
        if (emailWorker) {
            shutdowns.push(emailWorker.close());
        }
        if (smsWorker) {
            shutdowns.push(smsWorker.close());
        }
        if (bookingEventsConsumer) {
            shutdowns.push(bookingEventsConsumer.close());
        }
        await Promise.allSettled(shutdowns);
        console.log(' Workers & consumers closed. Exiting process.');
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
