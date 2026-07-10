import crypto from 'node:crypto';
import { pool } from '../db/database.js';
import type { PaginatedResponse } from '../types/pagination.js';
import type {
    Report,
    ReportComparison,
    ReportInsightUserTimingComparison
} from '../types/report.js';
import type {
    PageSpeedStrategy,
    ReportInsightUserTiming,
    ReportInsights
} from '../types/report-insights.js';
import type { ReportGroupSummary } from '../types/report-group.js';
import type { ReportListQuery } from '../utils/pagination.js';
import { reportInsightsSchema } from '../validation/report-insights-schema.js';

type ReportRow = {
    id: string;
    project_id: string;
    group_id: string | null;
    group_name: string | null;
    group_page_url: string | null;
    group_strategy: PageSpeedStrategy | null;
    title: string;
    summary: string;
    page_url: string;
    accessibility_score: number;
    performance_score: number;
    seo_score: number;
    best_practices_score: number;
    agentic_browsing_score: number;
    insights: unknown;
    archived_at: Date | null;
    created_at: Date;
    previous_report_id: string | null;
    previous_created_at: Date | null;
    previous_accessibility_score: number | null;
    previous_performance_score: number | null;
    previous_seo_score: number | null;
    previous_best_practices_score: number | null;
    previous_agentic_browsing_score: number | null;
    previous_insights: unknown;
};

type CreateReportInput = {
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
    insights?: ReportInsights | null;
};

type UpdateReportInput = {
    groupId: string;
    title: string;
    summary: string;
    pageUrl: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ReportProjectAccess = {
    projectId: string;
    ownerId: string;
};

function parseReportInsights(value: unknown): ReportInsights | null {
    if (value === null || value === undefined) {
        return null;
    }

    const result = reportInsightsSchema.safeParse(value);

    return result.success ? result.data : null;
}

function serialiseReportInsights(value: ReportInsights | null): string | null {
    return value === null ? null : JSON.stringify(value);
}

function mapReportGroupSummary(row: ReportRow): ReportGroupSummary | null {
    if (!row.group_id || !row.group_name || !row.group_page_url || !row.group_strategy) {
        return null;
    }

    return {
        id: row.group_id,
        name: row.group_name,
        pageUrl: row.group_page_url,
        strategy: row.group_strategy
    };
}

function getTimingComparisonValue(timing: ReportInsightUserTiming): number | null {
    return timing.entryType === 'measure' ? timing.duration : timing.startTime;
}

function mapUserTimingComparisons(
    currentInsights: ReportInsights | null,
    previousInsights: ReportInsights | null,
    previousReportId: string,
    previousCreatedAt: string
): ReportInsightUserTimingComparison[] {
    const previousTimings = new Map<string, ReportInsightUserTiming>();

    for (const timing of previousInsights?.userTimings ?? []) {
        previousTimings.set(`${timing.entryType}:${timing.name}`, timing);
    }

    return (currentInsights?.userTimings ?? []).map((timing) => {
        const previousTiming = previousTimings.get(`${timing.entryType}:${timing.name}`);
        const currentValue = getTimingComparisonValue(timing);
        const previousValue = previousTiming ? getTimingComparisonValue(previousTiming) : null;
        const delta =
            currentValue !== null && previousValue !== null
                ? currentValue - previousValue
                : null;

        return {
            name: timing.name,
            entryType: timing.entryType,
            currentValue,
            previousValue,
            delta,
            unit: 'ms',
            previousReportId,
            previousCreatedAt
        };
    });
}

function mapReportComparison(
    row: ReportRow,
    currentInsights: ReportInsights | null
): ReportComparison | null {
    if (
        !row.previous_report_id ||
        !row.previous_created_at ||
        row.previous_accessibility_score === null ||
        row.previous_performance_score === null ||
        row.previous_seo_score === null ||
        row.previous_best_practices_score === null ||
        row.previous_agentic_browsing_score === null
    ) {
        return null;
    }

    const previousCreatedAt = row.previous_created_at.toISOString();
    const previousInsights = parseReportInsights(row.previous_insights);
    const userTimings = mapUserTimingComparisons(
        currentInsights,
        previousInsights,
        row.previous_report_id,
        previousCreatedAt
    );

    return {
        previousReportId: row.previous_report_id,
        previousCreatedAt,
        scores: {
            performanceScore: row.performance_score - row.previous_performance_score,
            accessibilityScore: row.accessibility_score - row.previous_accessibility_score,
            seoScore: row.seo_score - row.previous_seo_score,
            bestPracticesScore: row.best_practices_score - row.previous_best_practices_score,
            agenticBrowsingScore: row.agentic_browsing_score - row.previous_agentic_browsing_score
        },
        ...(userTimings.length > 0 ? { userTimings } : {})
    };
}

function mapReportRow(row: ReportRow): Report {
    const insights = parseReportInsights(row.insights);

    return {
        id: row.id,
        projectId: row.project_id,
        groupId: row.group_id,
        group: mapReportGroupSummary(row),
        title: row.title,
        summary: row.summary,
        pageUrl: row.page_url,
        accessibilityScore: row.accessibility_score,
        performanceScore: row.performance_score,
        seoScore: row.seo_score,
        bestPracticesScore: row.best_practices_score,
        agenticBrowsingScore: row.agentic_browsing_score,
        insights,
        comparison: mapReportComparison(row, insights),
        archivedAt: row.archived_at?.toISOString() ?? null,
        createdAt: row.created_at.toISOString()
    };
}

function getReportSelectSql(source = 'r'): string {
    return `
        ${source}.id,
        ${source}.project_id,
        ${source}.group_id,
        g.name AS group_name,
        g.page_url AS group_page_url,
        g.strategy AS group_strategy,
        ${source}.title,
        ${source}.summary,
        ${source}.page_url,
        ${source}.accessibility_score,
        ${source}.performance_score,
        ${source}.seo_score,
        ${source}.best_practices_score,
        ${source}.agentic_browsing_score,
        ${source}.insights,
        ${source}.archived_at,
        ${source}.created_at,
        previous_report.id AS previous_report_id,
        previous_report.created_at AS previous_created_at,
        previous_report.accessibility_score AS previous_accessibility_score,
        previous_report.performance_score AS previous_performance_score,
        previous_report.seo_score AS previous_seo_score,
        previous_report.best_practices_score AS previous_best_practices_score,
        previous_report.agentic_browsing_score AS previous_agentic_browsing_score,
        previous_report.insights AS previous_insights
    `;
}

function getReportJoinSql(source = 'r'): string {
    return `
        LEFT JOIN report_groups g ON g.id = ${source}.group_id
        LEFT JOIN LATERAL (
            SELECT
                id,
                created_at,
                accessibility_score,
                performance_score,
                seo_score,
                best_practices_score,
                agentic_browsing_score,
                insights
            FROM reports candidate_report
            WHERE candidate_report.project_id = ${source}.project_id
              AND candidate_report.group_id = ${source}.group_id
              AND candidate_report.archived_at IS NULL
              AND (
                candidate_report.created_at < ${source}.created_at
                OR (
                    candidate_report.created_at = ${source}.created_at
                    AND candidate_report.id < ${source}.id
                )
              )
            ORDER BY candidate_report.created_at DESC, candidate_report.id DESC
            LIMIT 1
        ) previous_report ON TRUE
    `;
}

async function getPaginatedReportsByProjectId(
    projectId: string,
    query: ReportListQuery
): Promise<PaginatedResponse<Report>> {
    const sortColumn = query.sort === 'title' ? 'r.title' : 'r.created_at';
    const sortOrder = query.order === 'asc' ? 'ASC' : 'DESC';
    const searchTerm = query.search.trim();
    const conditions = ['r.project_id = $1'];
    const params: unknown[] = [projectId];

    if (searchTerm !== '') {
        params.push(`%${searchTerm}%`);
        conditions.push(`(r.title ILIKE $${params.length} OR r.summary ILIKE $${params.length})`);
    }

    if (query.groupId !== '') {
        params.push(query.groupId);
        conditions.push(`r.group_id = $${params.length}`);
    }

    if (query.status === 'active') {
        conditions.push('r.archived_at IS NULL');
    }

    if (query.status === 'archived') {
        conditions.push('r.archived_at IS NOT NULL');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const totalResult = await pool.query<{ count: string }>(
        `
            SELECT COUNT(*) AS count
            FROM reports r
            ${whereClause}
        `,
        params
    );

    const total = Number(totalResult.rows[0]?.count ?? 0);
    const dataParams = [...params, query.limit, query.offset];
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const result = await pool.query<ReportRow>(
        `
            SELECT ${getReportSelectSql('r')}
            FROM reports r
            ${getReportJoinSql('r')}
            ${whereClause}
            ORDER BY ${sortColumn} ${sortOrder}
            LIMIT $${limitParam}
            OFFSET $${offsetParam}
        `,
        dataParams
    );

    return {
        data: result.rows.map(mapReportRow),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / query.limit)
        }
    };
}

async function getReportsByProjectId(projectId: string): Promise<Report[]> {
    const result = await pool.query<ReportRow>(
        `
            SELECT ${getReportSelectSql('r')}
            FROM reports r
            ${getReportJoinSql('r')}
            WHERE r.project_id = $1
              AND r.archived_at IS NULL
            ORDER BY r.created_at DESC
        `,
        [projectId]
    );

    return result.rows.map(mapReportRow);
}

async function createNewReport(input: CreateReportInput): Promise<Report> {
    const id = crypto.randomUUID();

    const result = await pool.query<ReportRow>(
        `
            WITH inserted AS (
                INSERT INTO reports (
                    id,
                    project_id,
                    group_id,
                    title,
                    summary,
                    page_url,
                    accessibility_score,
                    performance_score,
                    seo_score,
                    best_practices_score,
                    agentic_browsing_score,
                    insights
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
                RETURNING
                    id,
                    project_id,
                    group_id,
                    title,
                    summary,
                    page_url,
                    accessibility_score,
                    performance_score,
                    seo_score,
                    best_practices_score,
                    agentic_browsing_score,
                    insights,
                    archived_at,
                    created_at
            )
            SELECT ${getReportSelectSql('inserted')}
            FROM inserted
            ${getReportJoinSql('inserted')}
        `,
        [
            id,
            input.projectId,
            input.groupId,
            input.title.trim(),
            input.summary.trim(),
            input.pageUrl.trim(),
            input.accessibilityScore,
            input.performanceScore,
            input.seoScore,
            input.bestPracticesScore,
            input.agenticBrowsingScore,
            serialiseReportInsights(input.insights ?? null)
        ]
    );

    return mapReportRow(result.rows[0]);
}

async function getReportById(id: string): Promise<Report | undefined> {
    const result = await pool.query<ReportRow>(
        `
            SELECT ${getReportSelectSql('r')}
            FROM reports r
            ${getReportJoinSql('r')}
            WHERE r.id = $1
            LIMIT 1
        `,
        [id]
    );

    const row = result.rows[0];

    if (!row) {
        return undefined;
    }

    return mapReportRow(row);
}

async function getReportProjectAccess(reportId: string): Promise<ReportProjectAccess | undefined> {
    const result = await pool.query<{ project_id: string; owner_id: string }>(
        `
            SELECT r.project_id, p.user_id AS owner_id
            FROM reports r
            JOIN projects p ON p.id = r.project_id
            WHERE r.id = $1
            LIMIT 1
        `,
        [reportId]
    );

    const row = result.rows[0];

    return row
        ? {
            projectId: row.project_id,
            ownerId: row.owner_id
        }
        : undefined;
}

async function getReportProjectOwnerId(reportId: string): Promise<string | undefined> {
    const access = await getReportProjectAccess(reportId);

    return access?.ownerId;
}

async function updateReportById(id: string, input: UpdateReportInput): Promise<Report | undefined> {
    const result = await pool.query<ReportRow>(
        `
            WITH updated AS (
                UPDATE reports
                SET group_id = $1,
                    title = $2,
                    summary = $3,
                    page_url = $4,
                    accessibility_score = $5,
                    performance_score = $6,
                    seo_score = $7,
                    best_practices_score = $8,
                    agentic_browsing_score = $9
                WHERE id = $10
                RETURNING
                    id,
                    project_id,
                    group_id,
                    title,
                    summary,
                    page_url,
                    accessibility_score,
                    performance_score,
                    seo_score,
                    best_practices_score,
                    agentic_browsing_score,
                    insights,
                    archived_at,
                    created_at
            )
            SELECT ${getReportSelectSql('updated')}
            FROM updated
            ${getReportJoinSql('updated')}
        `,
        [
            input.groupId,
            input.title.trim(),
            input.summary.trim(),
            input.pageUrl.trim(),
            input.accessibilityScore,
            input.performanceScore,
            input.seoScore,
            input.bestPracticesScore,
            input.agenticBrowsingScore,
            id
        ]
    );

    const row = result.rows[0];

    return row ? mapReportRow(row) : undefined;
}

async function deleteReportById(id: string): Promise<boolean> {
    const result = await pool.query(
        `
            DELETE FROM reports
            WHERE id = $1
        `,
        [id]
    );

    return (result.rowCount ?? 0) > 0;
}

async function archiveReportById(id: string): Promise<Report | undefined> {
    const result = await pool.query<ReportRow>(
        `
            WITH updated AS (
                UPDATE reports
                SET archived_at = COALESCE(archived_at, NOW())
                WHERE id = $1
                RETURNING
                    id,
                    project_id,
                    group_id,
                    title,
                    summary,
                    page_url,
                    accessibility_score,
                    performance_score,
                    seo_score,
                    best_practices_score,
                    agentic_browsing_score,
                    insights,
                    archived_at,
                    created_at
            )
            SELECT ${getReportSelectSql('updated')}
            FROM updated
            ${getReportJoinSql('updated')}
        `,
        [id]
    );
    const row = result.rows[0];

    return row ? mapReportRow(row) : undefined;
}

async function restoreReportById(id: string): Promise<Report | undefined> {
    const result = await pool.query<ReportRow>(
        `
            WITH updated AS (
                UPDATE reports
                SET archived_at = NULL
                WHERE id = $1
                RETURNING
                    id,
                    project_id,
                    group_id,
                    title,
                    summary,
                    page_url,
                    accessibility_score,
                    performance_score,
                    seo_score,
                    best_practices_score,
                    agentic_browsing_score,
                    insights,
                    archived_at,
                    created_at
            )
            SELECT ${getReportSelectSql('updated')}
            FROM updated
            ${getReportJoinSql('updated')}
        `,
        [id]
    );
    const row = result.rows[0];

    return row ? mapReportRow(row) : undefined;
}

export {
    archiveReportById,
    createNewReport,
    deleteReportById,
    getPaginatedReportsByProjectId,
    getReportById,
    getReportProjectAccess,
    getReportProjectOwnerId,
    getReportsByProjectId,
    mapReportRow,
    restoreReportById,
    updateReportById
};
