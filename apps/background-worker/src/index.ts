import 'dotenv/config';
import { createEmailWorker } from './workers/emailWorker.js';


console.log(' [Background Worker Service] Starting worker...');


const emailWorker = createEmailWorker();

console.log(' [Background Worker] Listening for jobs on "email-queue"');

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down worker`);
  try {
    await emailWorker.close();
    console.log(' Worker closed. Exiting process.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
