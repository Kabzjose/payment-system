import app from './app';
import { env } from './config/env';
import { db } from './config/db';
import { subscriptionService } from './modules/subscriptions/subscription.service';

async function start() {
  // Test DB connection before accepting traffic
  await db.query('SELECT 1');
  console.log('✓ Database connected');

  // Seed plans from env into DB
  await subscriptionService.seedPlans();
  console.log('✓ Plans synced');
  app.listen(env.PORT, () => {
    console.log(`✓ Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});