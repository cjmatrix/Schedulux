import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

async function seedBillingLedger() {
  const mongoUri =
    process.env.MONGO_URI ||
    'mongodb+srv://cjmartingarrix_db_user:NlyeEslJGvPWY1AS@cluster0.35dd5rw.mongodb.net';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  const collection = db.collection('billing_ledgers');

  // Find existing tenants to associate
  const tenants = await db.collection('tenants').find({}).toArray();
  const primaryTenantId = tenants[0]?._id || 'tnt_Qb012pyfTyZDwW1ctXTF6';
  const tenantIds = tenants.length > 0 ? tenants.map((t) => t._id) : [primaryTenantId];

  console.log(`Associating transactions with tenant(s): ${tenantIds.join(', ')}`);

  // Generate realistic entries distributed across the past 30 days
  const now = new Date();
  const entries: any[] = [];

  const plans = [
    { tier: 'pro', amount: 2900 },
    { tier: 'business', amount: 7900 },
    { tier: 'enterprise', amount: 19900 },
  ];

  for (let i = 28; i >= 0; i--) {
    // Skip occasional days to create a natural realistic curve
    if (i % 6 === 0 && i !== 0) continue;

    const txDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    txDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);

    // 1 to 3 transactions on active days
    const txCount = i % 4 === 0 ? 3 : i % 2 === 0 ? 2 : 1;

    for (let j = 0; j < txCount; j++) {
      const plan = plans[(i + j) % plans.length];
      const tenantId = tenantIds[j % tenantIds.length];
      const eventId = `evt_seed_${nanoid(16)}`;
      const subId = `sub_seed_${nanoid(14)}`;
      const txnId = `txn_seed_${nanoid(14)}`;

      entries.push({
        _id: `ledg_${nanoid(21)}`,
        tenant_id: tenantId,
        event_type: 'transaction.completed',
        event_id: eventId,
        provider: 'paddle',
        amount: plan.amount,
        currency: 'USD',
        tier: plan.tier,
        status: 'completed',
        paddle_customer_id: `ctm_seed_${nanoid(12)}`,
        paddle_subscription_id: subId,
        paddle_transaction_id: txnId,
        details: {
          note: 'Seed dummy transaction for SuperAdmin revenue analytics',
          plan_name: plan.tier,
          billed_amount_usd: plan.amount / 100,
        },
        created_at: txDate,
      });
    }
  }

  console.log(`Inserting ${entries.length} dummy billing ledger entries into MongoDB...`);
  const result = await collection.insertMany(entries);
  console.log(`Successfully inserted ${result.insertedCount} billing ledger entries!`);

  // Aggregate to verify what the SuperAdmin chart will render
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const aggregateResult = await collection
    .aggregate([
      {
        $match: {
          created_at: { $gte: from, $lte: now },
          status: { $in: ['completed', 'activated', 'paid'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          amount: { $sum: '$amount' },
          transaction_count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  console.log(`\nAggregated Revenue Chart Data Points (${aggregateResult.length} days with revenue):`);
  console.table(
    aggregateResult.slice(-10).map((r) => ({
      Date: r._id,
      'Total Amount ($)': (r.amount / 100).toFixed(2),
      Transactions: r.transaction_count,
    }))
  );

  const totalRevenue = aggregateResult.reduce((sum, r) => sum + r.amount, 0);
  console.log(`\nTotal 30-Day Platform Revenue: $${(totalRevenue / 100).toFixed(2)}`);

  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
}

seedBillingLedger().catch((err) => {
  console.error('Failed to seed billing ledger:', err);
  process.exit(1);
});

