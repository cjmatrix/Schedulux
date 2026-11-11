import { Consumer, Kafka, logLevel } from 'kafkajs';
import { MongoClient, type Collection } from 'mongodb';

export const KAFKA_TOKEN_TOPIC =
  process.env.KAFKA_TOKEN_TOPIC || 'billing.tokens.consumed';
export const KAFKA_TOKEN_CONSUMER_GROUP =
  process.env.KAFKA_TOKEN_CONSUMER_GROUP_ID || 'background-worker-token-ledger';

export interface TokenLedgerDocument {
  _id: string;
  tenant_id: string;
  agent_id: string;
  source: 'customer_agent' | 'tenant_agent' | string;
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  created_at: Date;
}

export interface TokenLedgerConsumerController {
  close: () => Promise<void>;
}

export const startTokenLedgerConsumer = async (): Promise<TokenLedgerConsumerController | null> => {
  const brokersList = (process.env.KAFKA_BROKERS || 'localhost:9092')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/schedulux';
  const kafkaPassword = process.env.KAFKA_PASSWORD;
  const kafkaUsername = process.env.KAFKA_USERNAME || 'avnadmin';

  console.log(
    `[TokenLedgerConsumer] Initializing Kafka consumer on topic '${KAFKA_TOKEN_TOPIC}'...`,
  );

  let mongoClient: MongoClient | null = null;
  let kafkaConsumer: Consumer | null = null;
  let ledgerCollection: Collection<TokenLedgerDocument> | null = null;
  let flushTimer: NodeJS.Timeout | null = null;
  let buffer: TokenLedgerDocument[] = [];

  const flushBatch = async () => {
    if (!ledgerCollection || buffer.length === 0) return;
    const batchToInsert = buffer.splice(0, buffer.length);
    try {
      await ledgerCollection.insertMany(batchToInsert, { ordered: false });
      console.log(
        `[TokenLedgerConsumer] Batched inserted ${batchToInsert.length} token ledger records into MongoDB.`,
      );
    } catch (err: any) {
      if (err?.code === 11000 || err?.name === 'MongoBulkWriteError') {
        const inserted = err?.result?.nInserted ?? 0;
        console.log(
          `[TokenLedgerConsumer] Bulk inserted ${inserted} records (${batchToInsert.length - inserted} duplicate events safely skipped).`,
        );
      } else {
        console.error('[TokenLedgerConsumer] Error inserting token ledger batch:', err);
      }
    }
  };

  try {
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const db = mongoClient.db();
    ledgerCollection = db.collection<TokenLedgerDocument>('token_ledgers');

    // Create supporting indexes for tenant billing and agent analytics
    await ledgerCollection.createIndex({ tenant_id: 1, created_at: -1 }).catch(() => {});
    await ledgerCollection.createIndex({ agent_id: 1, created_at: -1 }).catch(() => {});
    console.log('[TokenLedgerConsumer] Connected to MongoDB "token_ledgers" collection');

    const kafka = new Kafka({
      clientId: 'background-worker-token-ledger',
      brokers: brokersList,
      ssl: kafkaPassword ? { rejectUnauthorized: false } : undefined,
      sasl: kafkaPassword
        ? {
            mechanism: 'scram-sha-256',
            username: kafkaUsername,
            password: kafkaPassword,
          }
        : undefined,
      logLevel: logLevel.WARN,
    });

    kafkaConsumer = kafka.consumer({ groupId: KAFKA_TOKEN_CONSUMER_GROUP });
    await kafkaConsumer.connect();
    await kafkaConsumer.subscribe({
      topic: KAFKA_TOKEN_TOPIC,
      fromBeginning: false,
    });

    console.log(
      `[TokenLedgerConsumer] Subscribed to Kafka topic '${KAFKA_TOKEN_TOPIC}' (group: '${KAFKA_TOKEN_CONSUMER_GROUP}')`,
    );

    // Flush batch every 1000ms
    flushTimer = setInterval(flushBatch, 1000);

    await kafkaConsumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        try {
          const raw = message.value.toString();
          const event = JSON.parse(raw);

          const inputTokens = Math.max(0, Number(event.input_tokens) || 0);
          const outputTokens = Math.max(0, Number(event.output_tokens) || 0);
          const totalTokens =
            Number(event.total_tokens) > 0 ? Number(event.total_tokens) : inputTokens + outputTokens;

          const deterministicId =
            event.event_id ||
            event._id ||
            `evt_tok_${event.tenant_id}_${event.agent_id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          const doc: TokenLedgerDocument = {
            _id: deterministicId,
            tenant_id: event.tenant_id || 'unknown',
            agent_id: event.agent_id || 'unknown',
            source: event.source || 'unknown',
            model_id: event.model_id || 'gemini-1.5-flash',
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: totalTokens,
            created_at: event.created_at ? new Date(event.created_at) : new Date(),
          };

          buffer.push(doc);

          // Eager flush if buffer reaches threshold
          if (buffer.length >= 100) {
            await flushBatch();
          }
        } catch (parseErr) {
          console.error('[TokenLedgerConsumer] Error parsing event payload:', parseErr);
        }
      },
    });

    return {
      close: async () => {
        console.log('[TokenLedgerConsumer] Closing consumer & flushing buffer...');
        if (flushTimer) clearInterval(flushTimer);
        await flushBatch();
        if (kafkaConsumer) {
          try {
            await kafkaConsumer.disconnect();
          } catch (_) {}
        }
        if (mongoClient) {
          try {
            await mongoClient.close();
          } catch (_) {}
        }
      },
    };
  } catch (err) {
    console.error('[TokenLedgerConsumer] Failed to start token ledger consumer:', err);
    if (flushTimer) clearInterval(flushTimer);
    if (mongoClient) await mongoClient.close().catch(() => {});
    return null;
  }
};

