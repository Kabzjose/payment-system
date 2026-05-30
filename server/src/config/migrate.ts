import fs from 'fs';
import path from 'path';
import { db } from './db';

async function migrate() {
  // Create tracking table if it doesn't exist
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      run_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Find all .sql files in /migrations, sorted by name
  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    // Check if already run
    const { rows } = await db.query(
      'SELECT id FROM migrations WHERE filename = $1',
      [file]
    );

    if (rows.length > 0) {
      console.log(`  skip  ${file}`);
      continue;
    }

    // Run the migration inside a transaction
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      await db.query('COMMIT');
      console.log(`  ✓  ${file}`);
    } catch (err) {
      await db.query('ROLLBACK');
      console.error(`  ✗  ${file} — rolling back`);
      throw err;
    }
  }

  console.log('Migrations complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});