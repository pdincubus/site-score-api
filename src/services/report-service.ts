import crypto from 'node:crypto';
import { pool } from '../db/database.js';
import type { PaginatedResponse } from '../types/pagination.js';
import type { Report } from '../types/report.js';
import type { ReportListQuery } from '../utils/pagination.js';

type ReportRow = {
    id: string;
    project_id: string;
    title: string;
    summary: string;
    accessibility_score: number;
    performance_score: number;
    seo_score: number;
    ux_score: number;
    created_at: Date;
};

type CreateReportInput = {
    projectId: string;
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
};

type UpdateReportInput = {
    title?: string;
    summary?: string;
    accessibilityScore?: number;
    performanceScore?: number;
    seoScore?: number;
    uxScore?: number;
};

function mapReportRow(row: ReportRow): Report {
    return {
        id: row.id,
        projectId: row.project_id,
        title: row.title,
        summary: row.summary,
        accessibilityScore: row.accessibility_score,
        performanceScore: row.performance_score,
        seoScore: row.seo_score,
        uxScore: row.ux_score,
        createdAt: row.created_at.toISOString()
    };
}

async function getPaginatedReportsByProjectId(
    projectId: string,
    query: ReportListQuery
): Promise<PaginatedResponse<Report>> {
    const sortColumn = query.sort === 'title' ? 'title' : 'created_at';
    const sortOrder = query.order === 'asc' ? 'ASC' : 'DESC';
    const searchTerm = query.search.trim();

    const whereClause =
        searchTerm === ''
            ? `
                WHERE project_id = $1
            `
            : `
                WHERE project_id = $1
                  AND (
                    title ILIKE $2
                    OR summary ILIKE $2
                  )
            `;

    const totalParams =
        searchTerm === ''
            ? [projectId]
            : [projectId, `%${searchTerm}%`];

    const totalResult = await pool.query<{ count: string }>(
        `
            SELECT COUNT(*) AS count
            FROM reports
            ${whereClause}
        `,
        totalParams
    );

    const total = Number(totalResult.rows[0]?.count ?? 0);

    const dataParams =
        searchTerm === ''
            ? [projectId, query.limit, query.offset]
            : [projectId, `%${searchTerm}%`, query.limit, query.offset];

    const result = await pool.query<ReportRow>(
        `
            SELECT id, project_id, title, summary, accessibility_score, performance_score, seo_score, ux_score, created_at
            FROM reports
            ${whereClause}
            ORDER BY ${sortColumn} ${sortOrder}
            LIMIT $${searchTerm === '' ? 2 : 3}
            OFFSET $${searchTerm === '' ? 3 : 4}
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
            SELECT id, project_id, title, summary, accessibility_score, performance_score, seo_score, ux_score, created_at
            FROM reports
            WHERE project_id = $1
            ORDER BY created_at DESC
        `,
        [projectId]
    );

    return result.rows.map(mapReportRow);
}

async function createNewReport(input: CreateReportInput): Promise<Report> {
    const id = crypto.randomUUID();

    const result = await pool.query<ReportRow>(
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
            RETURNING id, project_id, title, summary, accessibility_score, performance_score, seo_score, ux_score, created_at
        `,
        [
            id,
            input.projectId,
            input.title.trim(),
            input.summary.trim(),
            input.accessibilityScore,
            input.performanceScore,
            input.seoScore,
            input.uxScore
        ]
    );

    return mapReportRow(result.rows[0]);
}

async function getReportById(id: string): Promise<Report | undefined> {
    const result = await pool.query<ReportRow>(
        `
            SELECT id, project_id, title, summary, accessibility_score, performance_score, seo_score, ux_score, created_at
            FROM reports
            WHERE id = $1
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

async function getReportProjectOwnerId(reportId: string): Promise<string | undefined> {
    const result = await pool.query<{ user_id: string }>(
        `
            SELECT p.user_id
            FROM reports r
            JOIN projects p ON p.id = r.project_id
            WHERE r.id = $1
            LIMIT 1
        `,
        [reportId]
    );

    return result.rows[0]?.user_id;
}

async function updateReportById(id: string, input: UpdateReportInput): Promise<Report | undefined> {
    const existingResult = await pool.query<ReportRow>(
        `
            SELECT id, project_id, title, summary, accessibility_score, performance_score, seo_score, ux_score, created_at
            FROM reports
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );

    const existingRow = existingResult.rows[0];

    if (!existingRow) {
        return undefined;
    }

    const nextTitle = input.title !== undefined ? input.title.trim() : existingRow.title;
    const nextSummary = input.summary !== undefined ? input.summary.trim() : existingRow.summary;
    const nextAccessibilityScore = input.accessibilityScore ?? existingRow.accessibility_score;
    const nextPerformanceScore = input.performanceScore ?? existingRow.performance_score;
    const nextSeoScore = input.seoScore ?? existingRow.seo_score;
    const nextUxScore = input.uxScore ?? existingRow.ux_score;

    const result = await pool.query<ReportRow>(
        `
            UPDATE reports
            SET title = $1,
                summary = $2,
                accessibility_score = $3,
                performance_score = $4,
                seo_score = $5,
                ux_score = $6
            WHERE id = $7
            RETURNING id, project_id, title, summary, accessibility_score, performance_score, seo_score, ux_score, created_at
        `,
        [
            nextTitle,
            nextSummary,
            nextAccessibilityScore,
            nextPerformanceScore,
            nextSeoScore,
            nextUxScore,
            id
        ]
    );

    return mapReportRow(result.rows[0]);
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

export {
    createNewReport,
    deleteReportById,
    getPaginatedReportsByProjectId,
    getReportById,
    getReportProjectOwnerId,
    getReportsByProjectId,
    mapReportRow,
    updateReportById
};