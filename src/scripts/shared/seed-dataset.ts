import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { ReportInsights } from '../../types/report-insights.js';

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
    groupId: string;
    title: string;
    summary: string;
    pageUrl: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
    insights: ReportInsights | null;
    createdAt: string;
};

type SeedReportGroup = {
    id: string;
    projectId: string;
    name: string;
    pageUrl: string;
    strategy: 'mobile' | 'desktop';
};

type SeedData = {
    users: SeedUser[];
    projects: SeedProject[];
    reportGroups: SeedReportGroup[];
    reports: SeedReport[];
};

const PASSWORD_SALT_ROUNDS = 12;

type SeedProjectDefinition = {
    name: string;
    url: string;
    pages: {
        homepage: string;
        pricing: string;
    };
};

type ScoreSet = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ReportSnapshot = ScoreSet & {
    date: string;
};

const projectDefinitions: SeedProjectDefinition[] = [
    {
        name: 'Crayons & Code',
        url: 'https://crayonsandcode.co.uk/',
        pages: {
            homepage: 'https://crayonsandcode.co.uk/',
            pricing: 'https://crayonsandcode.co.uk/pricing/'
        }
    },
    {
        name: 'Example Commerce',
        url: 'https://example.com/',
        pages: {
            homepage: 'https://example.com/',
            pricing: 'https://example.com/pricing/'
        }
    }
];

const groupDefinitions = [
    {
        name: 'Homepage mobile',
        pageKey: 'homepage',
        strategy: 'mobile'
    },
    {
        name: 'Homepage desktop',
        pageKey: 'homepage',
        strategy: 'desktop'
    },
    {
        name: 'Pricing mobile',
        pageKey: 'pricing',
        strategy: 'mobile'
    },
    {
        name: 'Pricing desktop',
        pageKey: 'pricing',
        strategy: 'desktop'
    }
] as const;

type GroupDefinition = (typeof groupDefinitions)[number];

const reportSnapshots: ReportSnapshot[] = [
    {
        date: '2026-06-08T09:30:00.000Z',
        performanceScore: 68,
        accessibilityScore: 97,
        seoScore: 100,
        bestPracticesScore: 86,
        agenticBrowsingScore: 82
    },
    {
        date: '2026-07-08T09:30:00.000Z',
        performanceScore: 75,
        accessibilityScore: 97,
        seoScore: 98,
        bestPracticesScore: 90,
        agenticBrowsingScore: 79
    }
];

function adjustScore(score: number, offset: number): number {
    return Math.max(0, Math.min(100, score + offset));
}

function buildSnapshotScores(
    snapshot: ReportSnapshot,
    projectIndex: number,
    groupIndex: number
): ScoreSet {
    const offset = projectIndex * -2 + groupIndex;

    return {
        performanceScore: adjustScore(snapshot.performanceScore, offset),
        accessibilityScore: adjustScore(snapshot.accessibilityScore, projectIndex),
        seoScore: adjustScore(snapshot.seoScore, groupIndex % 2),
        bestPracticesScore: adjustScore(snapshot.bestPracticesScore, offset),
        agenticBrowsingScore: adjustScore(snapshot.agenticBrowsingScore, offset)
    };
}

function buildInsights(
    group: SeedReportGroup,
    scores: ScoreSet,
    createdAt: string,
    snapshotIndex: number
): ReportInsights {
    const isMobile = group.strategy === 'mobile';
    const isLatest = snapshotIndex === reportSnapshots.length - 1;
    const pageWeight = isMobile
        ? isLatest ? 1837056 : 2162688
        : isLatest ? 1212416 : 1392640;
    const documentWeight = isMobile ? 48256 : 38432;
    const cssWeight = isMobile ? 84320 : 62312;
    const jsWeight = isMobile
        ? isLatest ? 612448 : 741376
        : isLatest ? 386144 : 452608;
    const imageWeight = Math.max(pageWeight - documentWeight - cssWeight - jsWeight - 128000, 0);
    const fontWeight = isMobile ? 128000 : 96000;
    const domNodes = isMobile
        ? isLatest ? 932 : 1040
        : isLatest ? 812 : 884;
    const finalUrl = group.pageUrl.includes('crayonsandcode.co.uk')
        ? group.pageUrl.replace('https://crayonsandcode.co.uk', 'https://www.crayonsandcode.co.uk')
        : group.pageUrl;
    const hydrateDuration = isLatest ? 850 : 1270;
    const readyStartTime = isLatest ? 3200 : 3000;

    return {
        source: 'PAGESPEED',
        strategy: group.strategy,
        testedUrl: group.pageUrl,
        finalUrl,
        fetchedAt: createdAt,
        lighthouseVersion: '13.0.0',
        scores: {
            performance: scores.performanceScore,
            accessibility: scores.accessibilityScore,
            bestPractices: scores.bestPracticesScore,
            seo: scores.seoScore,
            agenticBrowsing: null
        },
        metrics: {
            pageWeight: {
                value: pageWeight,
                unit: 'bytes',
                displayValue: null,
                category: 'performance'
            },
            firstContentfulPaint: {
                value: isMobile ? 1420 : 720,
                unit: 'ms',
                displayValue: isMobile ? '1.4 s' : '0.7 s',
                category: 'performance'
            },
            speedIndex: {
                value: isMobile ? 2940 : 1320,
                unit: 'ms',
                displayValue: isMobile ? '2.9 s' : '1.3 s',
                category: 'performance'
            },
            largestContentfulPaint: {
                value: isMobile ? 3180 : 1480,
                unit: 'ms',
                displayValue: isMobile ? '3.2 s' : '1.5 s',
                category: 'performance'
            },
            cumulativeLayoutShift: {
                value: 0.03,
                unit: 'unitless',
                displayValue: '0.03',
                category: 'performance'
            },
            totalBlockingTime: {
                value: isMobile ? 210 : 55,
                unit: 'ms',
                displayValue: isMobile ? '210 ms' : '55 ms',
                category: 'performance'
            },
            timeToInteractive: {
                value: isMobile ? 3900 : 1700,
                unit: 'ms',
                displayValue: isMobile ? '3.9 s' : '1.7 s',
                category: 'performance'
            },
            interactionToNextPaint: {
                value: isMobile ? 180 : 90,
                unit: 'ms',
                displayValue: isMobile ? '180 ms' : '90 ms',
                category: 'performance'
            }
        },
        fieldData: null,
        resourceSummary: {
            items: [
                {
                    resourceType: 'total',
                    label: 'Total',
                    requestCount: isMobile ? 24 : 18,
                    transferSize: pageWeight
                },
                {
                    resourceType: 'document',
                    label: 'HTML',
                    requestCount: 1,
                    transferSize: documentWeight
                },
                {
                    resourceType: 'stylesheet',
                    label: 'CSS',
                    requestCount: isMobile ? 3 : 2,
                    transferSize: cssWeight
                },
                {
                    resourceType: 'script',
                    label: 'JavaScript',
                    requestCount: isMobile ? 5 : 4,
                    transferSize: jsWeight
                },
                {
                    resourceType: 'image',
                    label: 'Images',
                    requestCount: isMobile ? 8 : 6,
                    transferSize: imageWeight
                },
                {
                    resourceType: 'font',
                    label: 'Fonts',
                    requestCount: 2,
                    transferSize: fontWeight
                }
            ]
        },
        domSize: {
            totalElements: domNodes,
            maxDepth: isMobile ? 17 : 15,
            maxChildElements: isMobile ? 42 : 36,
            displayValue: `${domNodes.toLocaleString('en-GB')} elements`
        },
        opportunities: [
            {
                id: 'render-blocking-resources',
                title: 'Eliminate render-blocking resources',
                displayValue: 'Potential savings of 520 ms',
                score: 0.71,
                overallSavingsMs: 520
            },
            {
                id: 'unused-javascript',
                title: 'Reduce unused JavaScript',
                displayValue: 'Potential savings of 280 ms',
                score: 0.82,
                overallSavingsMs: 280
            }
        ],
        auditRefs: [
            {
                id: 'tap-targets',
                title: 'Tap targets are not sized appropriately',
                category: 'seo',
                severity: 'fail',
                displayValue: null,
                score: 0
            },
            {
                id: 'uses-long-cache-ttl',
                title: 'Uses efficient cache policy on static assets',
                category: 'performance',
                severity: 'warning',
                displayValue: '4 resources found',
                score: 0.5
            }
        ],
        userTimings: [
            {
                name: 'app:hydrate',
                entryType: 'measure',
                startTime: isLatest ? 690 : 780,
                duration: hydrateDuration,
                displayValue: `${hydrateDuration} ms`
            },
            {
                name: 'app:ready',
                entryType: 'mark',
                startTime: readyStartTime,
                duration: null,
                displayValue: `${(readyStartTime / 1000).toFixed(1)} s`
            }
        ]
    };
}

async function buildSeedData(): Promise<SeedData> {
    const passwordHash = await bcrypt.hash('secret123', PASSWORD_SALT_ROUNDS);

    const philUser: SeedUser = {
        id: crypto.randomUUID(),
        name: 'Phil',
        email: 'phil@example.com',
        passwordHash
    };

    const projects: SeedProject[] = projectDefinitions.map((project) => ({
        id: crypto.randomUUID(),
        name: project.name,
        url: project.url,
        userId: philUser.id
    }));

    const reportGroups: SeedReportGroup[] = projects.flatMap((project, projectIndex) =>
        groupDefinitions.map((group) => {
            const projectDefinition = projectDefinitions[projectIndex] as SeedProjectDefinition;

            return {
                id: crypto.randomUUID(),
                projectId: project.id,
                name: group.name,
                pageUrl: projectDefinition.pages[group.pageKey],
                strategy: group.strategy
            };
        })
    );

    const reports: SeedReport[] = reportGroups.flatMap((group, groupIndex) => {
        const projectIndex = projects.findIndex((project) => project.id === group.projectId);
        const groupDefinition = groupDefinitions[groupIndex % groupDefinitions.length] as GroupDefinition;

        return reportSnapshots.map((snapshot, snapshotIndex) => {
            const scores = buildSnapshotScores(snapshot, projectIndex, groupIndex);
            const reportLabel = snapshotIndex === 0 ? 'June baseline' : 'July snapshot';

            return {
                id: crypto.randomUUID(),
                projectId: group.projectId,
                groupId: group.id,
                title: `${group.name} - ${reportLabel}`,
                summary: `${groupDefinition.name} ${reportLabel.toLowerCase()} for visual UI testing.`,
                pageUrl: group.pageUrl,
                ...scores,
                insights: buildInsights(group, scores, snapshot.date, snapshotIndex),
                createdAt: snapshot.date
            };
        });
    });

    return {
        users: [philUser],
        projects,
        reportGroups,
        reports
    };
}

export { buildSeedData };
export type { SeedData, SeedUser, SeedProject, SeedReport, SeedReportGroup };
