import fs from 'node:fs/promises';
import path from 'node:path';
import { migrationPool } from '../db/migration-database.js';

const migrationsDir = path.resolve(process.cwd(), 'sql/migrations');

async function ensureMigrationsTable() {
    await migrationPool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL UNIQUE,
            run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

async function getAppliedMigrationFilenames(): Promise<Set<string>> {
    const result = await migrationPool.query<{ filename: string }>(`
        SELECT filename
        FROM schema_migrations
        ORDER BY filename ASC
    `);

    return new Set(result.rows.map((row) => row.filename));
}

async function runMigrations() {
    await ensureMigrationsTable();

    const appliedMigrations = await getAppliedMigrationFilenames();
    const filenames = await fs.readdir(migrationsDir);
    const sortedFilenames = filenames
        .filter((filename) => filename.endsWith('.sql'))
        .sort();

    for (const filename of sortedFilenames) {
        if (appliedMigrations.has(filename)) {
            console.log(`Skipping already applied migration: ${filename}`);
            continue;
        }

        const filePath = path.join(migrationsDir, filename);
        const sql = await fs.readFile(filePath, 'utf8');

        console.log(`Running migration: ${filename}`);

        await migrationPool.query('BEGIN');

        try {
            await migrationPool.query(sql);
            await migrationPool.query(
                `
                    INSERT INTO schema_migrations (filename)
                    VALUES ($1)
                `,
                [filename]
            );
            await migrationPool.query('COMMIT');
        } catch (error) {
            await migrationPool.query('ROLLBACK');
            throw error;
        }
    }

    console.log('Migrations complete.');
}

runMigrations()
    .catch((error) => {
        console.error('Migration run failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await migrationPool.end();
    });