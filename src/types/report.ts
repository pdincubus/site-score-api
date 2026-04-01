type Report = {
    id: string;
    projectId: string;
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
    createdAt: string;
};

export type { Report };