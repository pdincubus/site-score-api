import crypto from 'node:crypto';
import { pool } from '../db/database.js';
import type { PageSpeedStrategy } from '../types/report-insights.js';
import type { ReportGroup, ReportGroupSummary } from '../types/report-group.js';
import type {
    ReportGroupTrend,
    ReportTrendPoint,
    ReportTrendTechnicalMetrics
} from '../types/report-trend.js';
import { reportInsightsSchema } from '../validation/report-insights-schema.js';

type ReportGroupRow = {
    id: string;
    project_id: string;
    name: string;
    page_url: string;
    strategy: PageSpeedStrategy;
    created_at: Date;
};

type CreateReportGroupInput = {
    projectId: string;
    name: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
};

type ReportGroupTrendRow = {
    group_id: string;
    group_name: string;
    group_page_url: string;
    group_strategy: PageSpeedStrategy;
    report_id: string | null;
    report_title: string | null;
    report_page_url: string | null;
    report_created_at: Date | null;
    performance_score: number | null;
    accessibility_score: number | null;
    seo_score: number | null;
    best_practices_score: number | null;
    agentic_browsing_score: number | null;
    insights: unknown;
};

function mapReportGroupRow(row: ReportGroupRow): ReportGroup {
    return {
        id: row.id,
        projectId: row.project_id,
        name: row.name,
        pageUrl: row.page_url,
        strategy: row.strategy,
        createdAt: row.created_at.toISOString()
    };
}

function mapReportGroupSummary(row: ReportGroupRow): ReportGroupSummary {
    return {
        id: row.id,
        name: row.name,
        pageUrl: row.page_url,
        strategy: row.strategy
    };
}

async function createNewReportGroup(input: CreateReportGroupInput): Promise<ReportGroup> {
    const id = crypto.randomUUID();
    const result = await pool.query<ReportGroupRow>(
        `
            INSERT INTO report_groups (id, project_id, name, page_url, strategy)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, project_id, name, page_url, strategy, created_at
        `,
        [
            id,
            input.projectId,
            input.name.trim(),
            input.pageUrl.trim(),
            input.strategy
        ]
    );

    return mapReportGroupRow(result.rows[0]);
}

async function getReportGroupsByProjectId(projectId: string): Promise<ReportGroup[]> {
    const result = await pool.query<ReportGroupRow>(
        `
            SELECT id, project_id, name, page_url, strategy, created_at
            FROM report_groups
            WHERE project_id = $1
            ORDER BY name ASC, created_at ASC
        `,
        [projectId]
    );

    return result.rows.map(mapReportGroupRow);
}

async function getReportGroupById(id: string): Promise<ReportGroup | undefined> {
    const result = await pool.query<ReportGroupRow>(
        `
            SELECT id, project_id, name, page_url, strategy, created_at
            FROM report_groups
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );

    const row = result.rows[0];

    return row ? mapReportGroupRow(row) : undefined;
}

async function getReportGroupProjectId(id: string): Promise<string | undefined> {
    const result = await pool.query<{ project_id: string }>(
        `
            SELECT project_id
            FROM report_groups
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );

    return result.rows[0]?.project_id;
}

function getReportTrendTechnicalMetrics(value: unknown): ReportTrendTechnicalMetrics | undefined {
    const result = reportInsightsSchema.safeParse(value);

    if (!result.success) {
        return undefined;
    }

    const insights = result.data;
    const pageWeight = insights.metrics.pageWeight;
    const pageWeightBytes = pageWeight?.unit === 'bytes' ? pageWeight.value : null;
    const domNodes = insights.domSize?.totalElements ?? null;
    const resources = insights.resourceSummary?.items ?? [];

    if (pageWeightBytes === null && domNodes === null && resources.length === 0) {
        return undefined;
    }

    return {
        pageWeightBytes,
        domNodes,
        resources
    };
}

function mapTrendPoint(row: ReportGroupTrendRow): ReportTrendPoint | null {
    if (
        !row.report_id ||
        !row.report_title ||
        !row.report_page_url ||
        !row.report_created_at ||
        row.performance_score === null ||
        row.accessibility_score === null ||
        row.seo_score === null ||
        row.best_practices_score === null ||
        row.agentic_browsing_score === null
    ) {
        return null;
    }

    const technicalMetrics = getReportTrendTechnicalMetrics(row.insights);

    return {
        id: row.report_id,
        title: row.report_title,
        pageUrl: row.report_page_url,
        createdAt: row.report_created_at.toISOString(),
        performanceScore: row.performance_score,
        accessibilityScore: row.accessibility_score,
        seoScore: row.seo_score,
        bestPracticesScore: row.best_practices_score,
        agenticBrowsingScore: row.agentic_browsing_score,
        ...(technicalMetrics ? { technicalMetrics } : {})
    };
}

function mapReportGroupTrendRows(rows: ReportGroupTrendRow[]): ReportGroupTrend[] {
    const trends = new Map<string, ReportGroupTrend>();

    for (const row of rows) {
        const trend = trends.get(row.group_id) ?? {
            groupId: row.group_id,
            groupName: row.group_name,
            pageUrl: row.group_page_url,
            strategy: row.group_strategy,
            points: []
        };
        const point = mapTrendPoint(row);

        if (point) {
            trend.points.push(point);
        }

        trends.set(row.group_id, trend);
    }

    return [...trends.values()];
}

async function getReportGroupTrendsByProjectId(
    projectId: string,
    groupId = ''
): Promise<ReportGroupTrend[]> {
    const params = groupId === '' ? [projectId] : [projectId, groupId];
    const groupFilter = groupId === '' ? '' : 'AND g.id = $2';
    const result = await pool.query<ReportGroupTrendRow>(
        `
            SELECT
                g.id AS group_id,
                g.name AS group_name,
                g.page_url AS group_page_url,
                g.strategy AS group_strategy,
                r.id AS report_id,
                r.title AS report_title,
                r.page_url AS report_page_url,
                r.created_at AS report_created_at,
                r.performance_score,
                r.accessibility_score,
                r.seo_score,
                r.best_practices_score,
                r.agentic_browsing_score,
                r.insights
            FROM report_groups g
            LEFT JOIN reports r ON r.group_id = g.id
                AND r.project_id = g.project_id
                AND r.archived_at IS NULL
            WHERE g.project_id = $1
              ${groupFilter}
            ORDER BY g.name ASC,
                g.created_at ASC,
                r.created_at ASC NULLS LAST,
                r.id ASC NULLS LAST
        `,
        params
    );

    return mapReportGroupTrendRows(result.rows);
}

export {
    createNewReportGroup,
    getReportGroupById,
    getReportGroupProjectId,
    getReportGroupTrendsByProjectId,
    getReportGroupsByProjectId,
    mapReportGroupRow,
    mapReportGroupSummary
};
export type { ReportGroupRow, ReportGroupTrendRow };
