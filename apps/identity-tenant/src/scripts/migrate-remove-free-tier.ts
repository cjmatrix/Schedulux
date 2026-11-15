import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Redis } from 'ioredis';

async function migrate() {
  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://cjmartingarrix_db_user:NlyeEslJGvPWY1AS@cluster0.35dd5rw.mongodb.net';
  const redisUri = process.env.REDIS_URI || 'redis://default:JhNA2MeHF1SBgxlspiC6AROIjGefw0I7@industrious-party-thrill-23156.db.redis.io:13355';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // 1. Update tenants with tier: 'free' to 'starter'
  const tenantsColl = db.collection('tenents');
  const updateTenantsResult = await tenantsColl.updateMany(
    { tier: 'free' },
    { $set: { tier: 'starter' } }
  );
  console.log(`Updated ${updateTenantsResult.modifiedCount} tenants from 'free' to 'starter'.`);

  // 2. Remove 'free' from tier_configs collection
  const tierConfigsColl = db.collection('tier_configs');
  const deleteTierResult = await tierConfigsColl.deleteOne({ tier: 'free' });
  console.log(`Deleted ${deleteTierResult.deletedCount} 'free' tier doc from tier_configs collection.`);

  // 3. Connect to Redis and evict/warm cache
  try {
    console.log('Connecting to Redis...');
    const redis = new Redis(redisUri);
    await redis.del('tier_config:free');
    await redis.del('tier_config:all');
    console.log('Evicted tier_config:free and tier_config:all from Redis.');

    // Fetch remaining tier configs
    const remaining = await tierConfigsColl.find({}).toArray();
    if (remaining.length > 0) {
      await redis.set('tier_config:all', JSON.stringify(remaining), 'EX', 86400 * 7);
      for (const t of remaining) {
        await redis.set(`tier_config:${t.tier}`, JSON.stringify(t), 'EX', 86400 * 7);
      }
      console.log(`Re-warmed ${remaining.length} tier configs in Redis.`);
    }
    await redis.quit();
  } catch (err) {
    console.error('Redis update warning:', err);
  }

  await mongoose.disconnect();
  console.log('Migration completed successfully.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

