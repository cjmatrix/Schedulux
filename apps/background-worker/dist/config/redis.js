import { Redis } from 'ioredis';
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
export const workerRedisConnection = new Redis(REDIS_URI, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
workerRedisConnection.on('connect', () => {
    console.log(' [Background Worker] Connected to Redis successfully');
});
workerRedisConnection.on('error', (err) => {
    console.error(' [Background Worker] Redis connection error:', err);
});
