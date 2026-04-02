import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { migrationPool } from '../db/migration-database.js';
import { env } from '../config/env.js';

type SeedUser = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
};

type SeedProject = {
    id: string;
    name: string;
    url: string;
    userId: string;
};

type SeedReport = {
    id: string;
    projectId: string;
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
};

async function seedTestData() {
    if (env.nodeEnv !== 'test') {
        throw new Error('seed-test-data must only be run with NODE_ENV=test');
    }

    const passwordHash = await bcrypt.hash('secret123', 10);

    const philUser: SeedUser = {
        id: crypto.randomUUID(),
        name: 'Phil',
        email: 'phil@example.com',
        passwordHash
    };

    const otherUser: SeedUser = {
        id: crypto.randomUUID(),
        name: 'Other User',
        email: 'other@example.com',
        passwordHash
    };

    const projects: SeedProject[] = [
        {
            id: crypto.randomUUID(),
            name: 'Site Score Marketing Site',
            url: 'https://site-score-marketing.test',
            userId: philUser.id
        },
        {
            id: crypto.randomUUID(),
            name: 'Accessibility Audit Tool',
            url: 'https://a11y-audit-tool.test',
            userId: philUser.id
        },
        {
            id: crypto.randomUUID(),
            name: 'NPPT Shop',
            url: 'https://nppt-shop.test',
            userId: otherUser.id
        }
    ];

    const reports: SeedReport[] = [
        {
            id: crypto.randomUUID(),
            projectId: projects[0].id,
            title: 'Homepage audit',
            summary: 'Homepage accessibility and performance review',
            accessibilityScore: 88,
            performanceScore: 91,
            seoScore: 79,
            uxScore: 84
        },
        {
            id: crypto.randomUUID(),
            projectId: projects[0].id,
            title: 'Checkout audit',
            summary: 'Checkout flow review',
            accessibilityScore: 82,
            performanceScore: 87,
            seoScore: 75,
            uxScore: 81
        },
        {
            id: crypto.randomUUID(),
            projectId: projects[1].id,
            title: 'Dashboard audit',
            summary: 'Dashboard usability review',
            accessibilityScore: 90,
            performanceScore: 85,
            seoScore: 70,
            uxScore: 86
        },
        {
            id: crypto.randomUUID(),
            projectId: projects[2].id,
            title: 'Shop landing page audit',
            summary: 'Landing page review for shop',
            accessibilityScore: 76,
            performanceScore: 80,
            seoScore: 83,
            uxScore: 78
        }
    ];

    await migrationPool.query('BEGIN');

    try {
        await migrationPool.query('DELETE FROM sessions');
        await migrationPool.query('DELETE FROM reports');
        await migrationPool.query('DELETE FROM projects');
        await migrationPool.query('DELETE FROM users');

        await migrationPool.query(
            `
                INSERT INTO users (id, name, email, password_hash)
                VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)
            `,
            [
                philUser.id,
                philUser.name,
                philUser.email,
                philUser.passwordHash,
                otherUser.id,
                otherUser.name,
                otherUser.email,
                otherUser.passwordHash
            ]
        );

        for (const project of projects) {
            await migrationPool.query(
                `
                    INSERT INTO projects (id, name, url, user_id)
                    VALUES ($1, $2, $3, $4)
                `,
                [project.id, project.name, project.url, project.userId]
            );
        }

        for (const report of reports) {
            await migrationPool.query(
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

        await migrationPool.query('COMMIT');

        console.log('Seeded test data successfully.');
        console.log('');
        console.log('Users:');
        console.log(`- ${philUser.email} / secret123`);
        console.log(`- ${otherUser.email} / secret123`);
        console.log('');
        console.log('Projects:');
        for (const project of projects) {
            console.log(`- ${project.name} (${project.id})`);
        }
        console.log('');
        console.log('Reports:');
        for (const report of reports) {
            console.log(`- ${report.title} (${report.id})`);
        }
    } catch (error) {
        await migrationPool.query('ROLLBACK');
        throw error;
    } finally {
        await migrationPool.end();
    }
}

seedTestData().catch((error) => {
    console.error('Seeding test data failed:', error);
    process.exitCode = 1;
});