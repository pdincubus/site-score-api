import type { Pool } from 'pg';
import { env } from '../../config/env.js';
import { getSeedConnectionString } from '../../db/seed-database.js';
import { buildSeedData } from './seed-dataset.js';

type DestructiveSeedSafetyOptions = {
    nodeEnv: string;
    connectionString: string;
    seedDatabaseUrl: string;
    allowDestructiveSeed: boolean;
};

const localDatabaseHosts = new Set(['localhost', '127.0.0.1', '::1']);

function getDatabaseHost(connectionString: string): string | null {
    try {
        const url = new URL(connectionString);

        return url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
    } catch {
        return null;
    }
}

function isLocalDatabaseConnection(connectionString: string): boolean {
    const host = getDatabaseHost(connectionString);

    return host !== null && localDatabaseHosts.has(host);
}

function assertDestructiveSeedAllowed(options: DestructiveSeedSafetyOptions) {
    const isRemoteTarget = !isLocalDatabaseConnection(options.connectionString);
    const requiresExplicitApproval =
        options.nodeEnv === 'production' || options.seedDatabaseUrl !== '' || isRemoteTarget;

    if (!requiresExplicitApproval || options.allowDestructiveSeed) {
        return;
    }

    throw new Error(
        'Destructive seed blocked. Set ALLOW_DESTRUCTIVE_SEED=true to confirm this database can be wiped.'
    );
}

async function runSeed(pool: Pool, label: string) {
    assertDestructiveSeedAllowed({
        nodeEnv: env.nodeEnv,
        connectionString: getSeedConnectionString(),
        seedDatabaseUrl: env.seedDatabaseUrl,
        allowDestructiveSeed: env.allowDestructiveSeed
    });

    const seedData = await buildSeedData();

    await pool.query('BEGIN');

    try {
        await pool.query('DELETE FROM sessions');
        await pool.query('DELETE FROM reports');
        await pool.query('DELETE FROM projects');
        await pool.query('DELETE FROM users');

        const [firstUser, secondUser] = seedData.users;

        await pool.query(
            `
                INSERT INTO users (id, name, email, password_hash)
                VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
            `,
            [
                firstUser.id,
                firstUser.name,
                firstUser.email,
                firstUser.passwordHash,
                secondUser.id,
                secondUser.name,
                secondUser.email,
                secondUser.passwordHash
            ]
        );

        for (const project of seedData.projects) {
            await pool.query(
                `
                    INSERT INTO projects (id, name, url, user_id)
                    VALUES ($1, $2, $3, $4)
                `,
                [project.id, project.name, project.url, project.userId]
            );
        }

        for (const report of seedData.reports) {
            await pool.query(
                `
                    INSERT INTO reports (
                        id,
                        project_id,
                        title,
                        summary,
                        accessibility_score,
                        performance_score,
                        seo_score,
                        ux_score
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `,
                [
                    report.id,
                    report.projectId,
                    report.title,
                    report.summary,
                    report.accessibilityScore,
                    report.performanceScore,
                    report.seoScore,
                    report.uxScore
                ]
            );
        }

        await pool.query('COMMIT');

        console.log(`Seeded ${label} data successfully.`);
        console.log('');
        console.log(`Users (${seedData.users.length}):`);

        for (const user of seedData.users) {
            console.log(`- ${user.email} / secret123`);
        }

        console.log('');
        console.log(`Projects: ${seedData.projects.length}`);
        console.log('Sample projects:');

        for (const project of seedData.projects.slice(0, 10)) {
            console.log(`- ${project.name} (${project.id})`);
        }

        console.log('');
        console.log(`Reports: ${seedData.reports.length}`);
        console.log('Sample reports:');

        for (const report of seedData.reports.slice(0, 10)) {
            console.log(`- ${report.title} (${report.id})`);
        }
    } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
    } finally {
        await pool.end();
    }
}

export { runSeed, assertDestructiveSeedAllowed };
