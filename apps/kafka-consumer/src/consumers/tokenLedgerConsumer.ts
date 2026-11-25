import { Client } from '@opensearch-project/opensearch';
import { Consumer, Kafka, logLevel } from 'kafkajs';

export const KAFKA_TOKEN_TOPIC =
  process.env.KAFKA_TOKEN_TOPIC || 'billing.tokens.consumed';
export const KAFKA_TOKEN_CONSUMER_GROUP =
  process.env.KAFKA_TOKEN_CONSUMER_GROUP_ID || 'kafka-consumer-token-ledger';

export const OPENSEARCH_INDEX = process.env.OPENSEARCH_TOKEN_INDEX || 'token-ledger';

export interface TokenLedgerDocument {
  event_id: string;
  tenant_id: string;
  agent_id: string;
  source: 'customer_agent' | 'tenant_agent' | string;
  model_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  created_at: string; 
}

export interface TokenLedgerConsumerController {
  close: () => Promise<void>;
}

export const startTokenLedgerConsumer = async (): Promise<TokenLedgerConsumerController | null> => {
  const brokersList = (process.env.KAFKA_BROKERS || 'localhost:9092')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

  const opensearchUrl = process.env.OPENSEARCH_URL;
  const kafkaPassword = process.env.KAFKA_PASSWORD;
  const kafkaUsername = process.env.KAFKA_USERNAME || 'avnadmin';

  if (!opensearchUrl) {
    console.error('[TokenLedgerConsumer] OPENSEARCH_URL env var is required');
    return null;
  }

  console.log(
    `[TokenLedgerConsumer] Initializing Kafka consumer on topic '${KAFKA_TOKEN_TOPIC}'...`,
  );

  let kafkaConsumer: Consumer | null = null;

  const osClient = new Client({ node: opensearchUrl });

  
  const bulkIndex = async (docs: TokenLedgerDocument[]): Promise<boolean> => {
    const bulkBody = docs.flatMap((doc) => [
      { create: { _index: OPENSEARCH_INDEX, _id: doc.event_id } },
      doc,
    ]);

    try {
      const { body: result } = await osClient.bulk({ body: bulkBody, refresh: false });

      const items = result.items as Array<{ create?: { status?: number; error?: unknown } }>;
      const errors = items.filter(
        (item) => item.create?.status !== 201 && item.create?.status !== 409,
      );
      const duplicates = items.filter((item) => item.create?.status === 409).length;
      const indexed = docs.length - errors.length - duplicates;

      if (errors.length > 0) {
        console.error(
          `[TokenLedgerConsumer] ${errors.length} docs failed to index:`,
          JSON.stringify(errors.slice(0, 3)),
        );
      }

      console.log(
        `[TokenLedgerConsumer] Bulk indexed ${indexed} records into OpenSearch` +
          (duplicates > 0 ? ` (${duplicates} duplicate events skipped)` : ''),
      );

      return true;
    } catch (err) {
      console.error('[TokenLedgerConsumer] OpenSearch bulk index error — offsets will NOT be committed:', err);
      return false;
    }
  };

  try {
    
    const indexExists = await osClient.indices.exists({ index: OPENSEARCH_INDEX });
    if (!indexExists.body) {
      await osClient.indices.create({
        index: OPENSEARCH_INDEX,
        body: {
          mappings: {
            properties: {
              event_id:     { type: 'keyword' },
              tenant_id:    { type: 'keyword' },
              agent_id:     { type: 'keyword' },
              source:       { type: 'keyword' },
              model_id:     { type: 'keyword' },
              input_tokens: { type: 'integer' },
              output_tokens:{ type: 'integer' },
              total_tokens: { type: 'integer' },
              created_at:   { type: 'date' },
            },
          },
        },
      });
      console.log(`[TokenLedgerConsumer] Created OpenSearch index '${OPENSEARCH_INDEX}'`);
    } else {
      console.log(`[TokenLedgerConsumer] OpenSearch index '${OPENSEARCH_INDEX}' already exists`);
    }

    const kafka = new Kafka({
      clientId: 'kafka-consumer-token-ledger',
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

    await kafkaConsumer.run({
     
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        const docs: TokenLedgerDocument[] = [];

        for (const message of batch.messages) {
        
          if (!isRunning() || isStale()) break;

          if (!message.value) {
            resolveOffset(message.offset);
            continue;
          }

          try {
            const event = JSON.parse(message.value.toString());

            const inputTokens  = Math.max(0, Number(event.input_tokens)  || 0);
            const outputTokens = Math.max(0, Number(event.output_tokens) || 0);
            const totalTokens  =
              Number(event.total_tokens) > 0
                ? Number(event.total_tokens)
                : inputTokens + outputTokens;

            const eventId =
              event.event_id ||
              event._id ||
              `evt_tok_${event.tenant_id}_${event.agent_id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            docs.push({
              event_id:      eventId,
              tenant_id:     event.tenant_id || 'unknown',
              agent_id:      event.agent_id  || 'unknown',
              source:        event.source    || 'unknown',
              model_id:      event.model_id  || 'gemini-1.5-flash',
              input_tokens:  inputTokens,
              output_tokens: outputTokens,
              total_tokens:  totalTokens,
              created_at:    event.created_at
                ? new Date(event.created_at).toISOString()
                : new Date().toISOString(),
            });
          } catch (parseErr) {
            console.error('[TokenLedgerConsumer] Failed to parse message, skipping offset:', parseErr);
           
            resolveOffset(message.offset);
          }

        
          await heartbeat();
        }

        if (docs.length === 0) return;

        
        const success = await bulkIndex(docs);
        if (!success) {
          throw new Error('[TokenLedgerConsumer] OpenSearch bulk failed — will retry batch');
        }

        
        const lastMessage = batch.messages[batch.messages.length - 1];
        if (lastMessage) resolveOffset(lastMessage.offset);
      },
    });

    return {
      close: async () => {
        console.log('[TokenLedgerConsumer] Closing consumer...');
        if (kafkaConsumer) {
          try {
            await kafkaConsumer.disconnect();
          } catch (_) {}
        }
        await osClient.close();
      },
    };
  } catch (err) {
    console.error('[TokenLedgerConsumer] Failed to start token ledger consumer:', err);
    await osClient.close().catch(() => {});
    return null;
  }
};

