import 'dotenv/config';
import {
  startBookingEventsConsumer,
  type BookingEventsConsumerController,
} from './consumers/bookingEventsConsumer.js';
import {
  startTokenLedgerConsumer,
  type TokenLedgerConsumerController,
} from './consumers/tokenLedgerConsumer.js';

console.log(' [Kafka Consumer Service] Starting consumers...');

let bookingEventsConsumer: BookingEventsConsumerController | null = null;
let tokenLedgerConsumer: TokenLedgerConsumerController | null = null;

async function bootstrap() {
  try {
    bookingEventsConsumer = await startBookingEventsConsumer();
    if (bookingEventsConsumer) {
      console.log(' [Kafka Consumer] Listening for domain events on Kafka "scheduling.booking.events"');
    }

    tokenLedgerConsumer = await startTokenLedgerConsumer();
    if (tokenLedgerConsumer) {
      console.log(' [Kafka Consumer] Listening for token usage on Kafka "billing.tokens.consumed"');
    }
  } catch (err: unknown) {
    console.error(' [Kafka Consumer] Failed to start consumers:', err);
    process.exit(1);
  }
}

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down consumers...`);
  try {
    const shutdowns: Promise<void>[] = [];
    if (bookingEventsConsumer) {
      shutdowns.push(bookingEventsConsumer.close());
    }
    if (tokenLedgerConsumer) {
      shutdowns.push(tokenLedgerConsumer.close());
    }
    await Promise.allSettled(shutdowns);
    console.log(' Consumers closed. Exiting process.');
    process.exit(0);
  } catch (error: unknown) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

bootstrap();
