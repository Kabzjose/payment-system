import { Pool } from 'pg';
import { env } from './env';

export const db = new Pool(
  env.DATABASE_URL
    ? {
        connectionString: env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // required for Neon
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 20000,
      }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

db.on('error', (err) => {
  console.error('Unexpected DB error', err);
  process.exit(-1);
});