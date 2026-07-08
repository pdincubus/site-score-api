import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pool } from '../db/database.js';

const migrationsDir = path.resolve(process.cwd(), 'sql/migrations');

async function runMigrationFile(filename: string, query: (sql: string) => Promise<unknown>) {
    const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');

    await query(sql);
}

describe('database migrations', () => {
    it('preserves legacy reports when adding report groups and replacing uxScore', async () => {
        const client = await pool.connect();
        const schemaName = `migration_${crypto.randomUUID().replace(/-/g, '')}`;
        const userId = '11111111-1111-1111-1111-111111111111';
        const projectId = '22222222-2222-2222-2222-222222222222';
        const reportId = '33333333-3333-3333-3333-333333333333';

        try {
            await client.query(`CREATE SCHEMA ${schemaName}`);
            await client.query(`SET search_path TO ${schemaName}`);

            for (const filename of [
                '001_initial_schema.sql',
                '002_add_project_user_id.sql',
                '003_add_report_score_checks.sql',
                '005_add_report_insights.sql'
            ]) {
                await runMigrationFile(filename, (sql) => client.query(sql));
            }

            await client.query(
                `
                    INSERT INTO users (id, name, email, password_hash)
                    VALUES ($1, $2, $3, $4)
                `,
                [
                    userId,
                    'Legacy user',
                    'legacy@example.com',
                    'password-hash'
                ]
            );
            await client.query(
                `
                    INSERT INTO projects (id, name, url, user_id)
                    VALUES ($1, $2, $3, $4)
                `,
                [
                    projectId,
                    'Legacy project',
                    'https://legacy-project.com',
                    userId
                ]
            );
            await client.query(
                `
                    INSERT INTO reports (
                        id,
                        project_id,
                        title,
                        summary,
                        accessibility_score,
                        performance_score,
                        seo_score,
                        ux_score,
                        created_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `,
                [
                    reportId,
                    projectId,
                    'Legacy report',
                    'Report created before report groups existed',
                    88,
                    72,
                    91,
                    77,
                    '2026-06-08T09:30:00.000Z'
                ]
            );

            await runMigrationFile(
                '006_add_report_groups_and_replace_ux_score.sql',
                (sql) => client.query(sql)
            );

            const reportResult = await client.query<{
                title: string;
                page_url: string;
                best_practices_score: number;
                agentic_browsing_score: number;
                group_name: string;
                group_page_url: string;
                group_strategy: string;
            }>(
                `
                    SELECT
                        r.title,
                        r.page_url,
                        r.best_practices_score,
                        r.agentic_browsing_score,
                        g.name AS group_name,
                        g.page_url AS group_page_url,
                        g.strategy AS group_strategy
                    FROM reports r
                    INNER JOIN report_groups g ON g.id = r.group_id
                    WHERE r.id = $1
                `,
                [reportId]
            );
            const columnsResult = await client.query<{ column_name: string }>(
                `
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = $1
                      AND table_name = 'reports'
                `,
                [schemaName]
            );

            expect(reportResult.rows).toEqual([
                {
                    title: 'Legacy report',
                    page_url: 'https://legacy-project.com',
                    best_practices_score: 77,
                    agentic_browsing_score: 77,
                    group_name: 'Legacy reports',
                    group_page_url: 'https://legacy-project.com',
                    group_strategy: 'desktop'
                }
            ]);
            expect(columnsResult.rows.map((row) => row.column_name)).not.toContain('ux_score');
        } finally {
            await client.query('RESET search_path');
            await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
            client.release();
        }
    });
});
