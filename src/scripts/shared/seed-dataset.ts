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

const PROJECT_COUNT = 75;
const REPORT_COUNT = 500;

function buildScore(seed: number, offset: number): number {
    return 60 + ((seed * 13 + offset * 7) % 40);
}

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

    const projects: SeedProject[] = Array.from({ length: PROJECT_COUNT }, (_, index) => {
        const projectNumber = index + 1;
        const owner = index < 60 ? philUser : otherUser;

        return {
            id: crypto.randomUUID(),
            name: `Seed Project ${projectNumber}`,
            url: `https://seed-project-${projectNumber}.test`,
            userId: owner.id
        };
    });

    const reports: SeedReport[] = Array.from({ length: REPORT_COUNT }, (_, index) => {
        const reportNumber = index + 1;
        const project = projects[index % projects.length];

        return {
            id: crypto.randomUUID(),
            projectId: project.id,
            title: `Automated audit ${reportNumber}`,
            summary: `Synthetic seeded report ${reportNumber} for pagination testing`,
            accessibilityScore: buildScore(reportNumber, 1),
            performanceScore: buildScore(reportNumber, 2),
            seoScore: buildScore(reportNumber, 3),
            uxScore: buildScore(reportNumber, 4)
        };
    });

    return {
        users: [philUser, otherUser],
        projects,
        reports
    };
}

export { buildSeedData };
export type { SeedData, SeedUser, SeedProject, SeedReport };