import dotenv from 'dotenv';
import { sql } from '@vercel/postgres';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = await fs.readdir(migrationsDir);
  migrationFiles.sort();

  for (const file of migrationFiles) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(migrationsDir, file);
      const migrationSql = await fs.readFile(filePath, 'utf-8');

      console.log(`Running migration: ${file}`);
      try {
        await sql.query(migrationSql);
        console.log(`Migration ${file} completed successfully.`);
      } catch (error) {
        console.error(`Error running migration ${file}:`, error);
        process.exit(1);
      }
    }
  }

  console.log('All migrations completed successfully.');
}

runMigrations().catch(console.error);