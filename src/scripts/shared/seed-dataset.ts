import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

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

type SeedData = {
    users: SeedUser[];
    projects: SeedProject[];
    reports: SeedReport[];
};

async function buildSeedData(): Promise<SeedData> {
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

    return {
        users: [philUser, otherUser],
        projects,
        reports
    };
}

export { buildSeedData };
export type { SeedData, SeedUser, SeedProject, SeedReport };