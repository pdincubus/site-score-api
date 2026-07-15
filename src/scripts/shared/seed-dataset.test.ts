import { describe, expect, it } from 'vitest';
import { buildSeedData } from './seed-dataset.js';

describe('buildSeedData', () => {
    it('builds visual report seed data for the current UI contract', async () => {
        const seedData = await buildSeedData();
        const homepageMobileGroup = seedData.reportGroups.find((group) => group.name === 'Homepage mobile');
        const latestHomepageMobileReport = seedData.reports.find(
            (report) => report.title === 'Homepage mobile - July snapshot'
        );

        expect(seedData.users).toHaveLength(1);
        expect(seedData.projects[0]).toMatchObject({
            name: 'Crayons & Code',
            url: 'https://crayonsandcode.co.uk/'
        });
        expect(homepageMobileGroup).toMatchObject({
            pageUrl: 'https://crayonsandcode.co.uk/',
            strategy: 'mobile'
        });

        for (const report of seedData.reports) {
            expect(report.groupId).toEqual(expect.any(String));
            expect(report.pageUrl).toMatch(/^https:\/\//);
            expect(report.insights).not.toBeNull();
            expect(report).not.toHaveProperty('uxScore');
        }

        expect(latestHomepageMobileReport).toMatchObject({
            performanceScore: 75,
            accessibilityScore: 97,
            seoScore: 98,
            bestPracticesScore: 90,
            agenticBrowsingScore: 79
        });
        expect(latestHomepageMobileReport?.insights?.metrics.pageWeight).toEqual({
            value: 1837056,
            unit: 'bytes',
            displayValue: null,
            category: 'performance'
        });
        expect(latestHomepageMobileReport?.insights?.resourceSummary?.items[0]).toEqual({
            resourceType: 'total',
            label: 'Total',
            requestCount: 24,
            transferSize: 1837056
        });
        expect(latestHomepageMobileReport?.insights?.domSize).toEqual({
            totalElements: 932,
            maxDepth: 17,
            maxChildElements: 42,
            displayValue: '932 elements'
        });
        expect(latestHomepageMobileReport?.insights?.auditRefs?.[0]).toMatchObject({
            id: 'tap-targets',
            severity: 'fail'
        });
        expect(latestHomepageMobileReport?.insights?.userTimings).toEqual([
            {
                name: 'app:hydrate',
                entryType: 'measure',
                startTime: 690,
                duration: 850,
                displayValue: '850 ms'
            },
            {
                name: 'app:ready',
                entryType: 'mark',
                startTime: 3200,
                duration: null,
                displayValue: '3.2 s'
            }
        ]);
    });
});
