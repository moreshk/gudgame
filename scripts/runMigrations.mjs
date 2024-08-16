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
  console.log(`Looking for migration files in: ${migrationsDir}`);
  
  const migrationFiles = await fs.readdir(migrationsDir);
  console.log(`Found ${migrationFiles.length} files in migrations directory`);
  
  migrationFiles.sort();
  console.log(`Sorted migration files: ${migrationFiles.join(', ')}`);

  for (const file of migrationFiles) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Reading migration file: ${filePath}`);
      
      const migrationSql = await fs.readFile(filePath, 'utf-8');
      console.log(`Migration SQL content:\n${migrationSql}`);

      console.log(`Running migration: ${file}`);
      try {
        const result = await sql.query(migrationSql);
        console.log(`Migration ${file} completed successfully.`);
        console.log(`Affected rows: ${result.rowCount}`);
      } catch (error) {
        console.error(`Error running migration ${file}:`, error);
        console.error(`Error details:`, error.message);
        process.exit(1);
      }
    } else {
      console.log(`Skipping non-SQL file: ${file}`);
    }
  }

  console.log('All migrations completed successfully.');
}

console.log('Starting migration process...');
runMigrations().catch(error => {
  console.error('Unhandled error during migration:', error);
  process.exit(1);
});