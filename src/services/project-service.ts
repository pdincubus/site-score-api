import crypto from 'node:crypto';
import { pool } from '../db/database.js';
import { AppError } from '../errors/app-error.js';
import type { PaginatedResponse } from '../types/pagination.js';
import type { Project, ProjectListItem } from '../types/project.js';
import type { ProjectListQuery } from '../utils/pagination.js';

type CreateProjectInput = {
    name: string;
    url: string;
    userId: string;
    clientId?: string | null;
};

type ProjectRow = {
    id: string;
    name: string;
    url: string;
    client_id: string | null;
    archived_at: Date | null;
    created_at: Date;
    user_id: string;
};

type ProjectListRow = ProjectRow & {
    report_count: number;
    report_group_count: number;
    latest_report_created_at: Date | null;
    latest_report_title: string | null;
    latest_performance_score: number | null;
    latest_accessibility_score: number | null;
    latest_seo_score: number | null;
    latest_best_practices_score: number | null;
    latest_agentic_browsing_score: number | null;
};

type UpdateProjectInput = {
    name?: string;
    url?: string;
    clientId?: string | null;
};

function mapProjectRow(row: ProjectRow): Project {
    return {
        id: row.id,
        name: row.name,
        url: row.url,
        clientId: row.client_id,
        archivedAt: row.archived_at?.toISOString() ?? null,
        createdAt: row.created_at.toISOString()
    };
}

function mapProjectListRow(row: ProjectListRow): ProjectListItem {
    const project = mapProjectRow(row);
    const latestScores =
        row.latest_performance_score === null ||
        row.latest_accessibility_score === null ||
        row.latest_seo_score === null ||
        row.latest_best_practices_score === null ||
        row.latest_agentic_browsing_score === null
            ? null
            : {
                performanceScore: row.latest_performance_score,
                accessibilityScore: row.latest_accessibility_score,
                seoScore: row.latest_seo_score,
                bestPracticesScore: row.latest_best_practices_score,
                agenticBrowsingScore: row.latest_agentic_browsing_score
            };

    return {
        ...project,
        summary: {
            reportCount: Number(row.report_count),
            reportGroupCount: Number(row.report_group_count),
            latestReportCreatedAt: row.latest_report_created_at?.toISOString() ?? null,
            latestReportTitle: row.latest_report_title,
            latestScores
        }
    };
}

async function getPaginatedProjects(
    query: ProjectListQuery,
    userId: string
): Promise<PaginatedResponse<ProjectListItem>> {
    const sortColumn = query.sort === 'name' ? 'p.name' : 'p.created_at';
    const sortOrder = query.order === 'asc' ? 'ASC' : 'DESC';
    const searchTerm = query.search.trim();
    const conditions = ['p.user_id = $1'];
    const params: unknown[] = [userId];

    if (query.status === 'active') {
        conditions.push('p.archived_at IS NULL');
    }

    if (query.status === 'archived') {
        conditions.push('p.archived_at IS NOT NULL');
    }

    if (searchTerm !== '') {
        params.push(`%${searchTerm}%`);
        conditions.push(`(p.name ILIKE $${params.length} OR p.url ILIKE $${params.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const totalResult = await pool.query<{ count: string }>(
        `
            SELECT COUNT(*) AS count
            FROM projects p
            ${whereClause}
        `,
        params
    );

    const total = Number(totalResult.rows[0]?.count ?? 0);
    const dataParams = [...params, query.limit, query.offset];
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;

    const result = await pool.query<ProjectListRow>(
        `
            WITH page_projects AS (
                SELECT p.id, p.name, p.url, p.client_id, p.archived_at, p.created_at, p.user_id
                FROM projects p
                ${whereClause}
                ORDER BY ${sortColumn} ${sortOrder}
                LIMIT $${limitParam}
                OFFSET $${offsetParam}
            )
            SELECT
                p.id,
                p.name,
                p.url,
                p.client_id,
                p.archived_at,
                p.created_at,
                p.user_id,
                COALESCE(report_counts.report_count, 0)::int AS report_count,
                COALESCE(report_group_counts.report_group_count, 0)::int AS report_group_count,
                latest_report.created_at AS latest_report_created_at,
                latest_report.title AS latest_report_title,
                latest_report.performance_score AS latest_performance_score,
                latest_report.accessibility_score AS latest_accessibility_score,
                latest_report.seo_score AS latest_seo_score,
                latest_report.best_practices_score AS latest_best_practices_score,
                latest_report.agentic_browsing_score AS latest_agentic_browsing_score
            FROM page_projects p
            LEFT JOIN LATERAL (
                SELECT COUNT(*)::int AS report_count
                FROM reports r
                WHERE r.project_id = p.id
                  AND r.archived_at IS NULL
            ) report_counts ON TRUE
            LEFT JOIN LATERAL (
                SELECT COUNT(*)::int AS report_group_count
                FROM report_groups g
                WHERE g.project_id = p.id
            ) report_group_counts ON TRUE
            LEFT JOIN LATERAL (
                SELECT
                    r.title,
                    r.created_at,
                    r.performance_score,
                    r.accessibility_score,
                    r.seo_score,
                    r.best_practices_score,
                    r.agentic_browsing_score
                FROM reports r
                WHERE r.project_id = p.id
                  AND r.archived_at IS NULL
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT 1
            ) latest_report ON TRUE
            ORDER BY ${sortColumn} ${sortOrder}
        `,
        dataParams
    );

    return {
        data: result.rows.map(mapProjectListRow),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / query.limit)
        }
    };
}

async function getAllProjects(): Promise<Project[]> {
    const result = await pool.query<ProjectRow>(
        `
            SELECT id, name, url, client_id, archived_at, created_at, user_id
            FROM projects
            ORDER BY created_at DESC
        `
    );

    return result.rows.map(mapProjectRow);
}

async function getProjectById(id: string): Promise<Project | undefined> {
    const result = await pool.query<ProjectRow>(
        `
            SELECT id, name, url, client_id, archived_at, created_at, user_id
            FROM projects
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );

    const row = result.rows[0];

    if (!row) {
        return undefined;
    }

    return mapProjectRow(row);
}

async function createNewProject(input: CreateProjectInput): Promise<Project> {
    const trimmedName = input.name.trim();
    const trimmedUrl = input.url.trim();

    const existingProject = await pool.query<{ id: string }>(
        `
            SELECT id
            FROM projects
            WHERE url = $1
            LIMIT 1
        `,
        [trimmedUrl]
    );

    if (existingProject.rows[0]) {
        throw new AppError('A project with this URL already exists', 409);
    }

    const id = crypto.randomUUID();

    const result = await pool.query<ProjectRow>(
        `
            INSERT INTO projects (id, name, url, user_id, client_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, url, client_id, archived_at, created_at, user_id
        `,
        [id, trimmedName, trimmedUrl, input.userId, input.clientId ?? null]
    );

    return mapProjectRow(result.rows[0]);
}

async function deleteProjectById(id: string): Promise<boolean> {
    const result = await pool.query(
        `
            DELETE FROM projects
            WHERE id = $1
        `,
        [id]
    );

    return (result.rowCount ?? 0) > 0;
}

async function updateProjectById(id: string, input: UpdateProjectInput): Promise<Project | undefined> {
    const existingResult = await pool.query<ProjectRow>(
        `
            SELECT id, name, url, client_id, archived_at, created_at, user_id
            FROM projects
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );

    const existingRow = existingResult.rows[0];

    if (!existingRow) {
        return undefined;
    }

    const nextName = input.name !== undefined ? input.name.trim() : existingRow.name;
    const nextUrl = input.url !== undefined ? input.url.trim() : existingRow.url;
    const nextClientId = input.clientId !== undefined ? input.clientId : existingRow.client_id;

    if (input.url !== undefined) {
        const duplicateResult = await pool.query<{ id: string }>(
            `
                SELECT id
                FROM projects
                WHERE url = $1
                  AND id <> $2
                LIMIT 1
            `,
            [nextUrl, id]
        );

        if (duplicateResult.rows[0]) {
            throw new AppError('A project with this URL already exists', 409);
        }
    }

    const result = await pool.query<ProjectRow>(
        `
            UPDATE projects
            SET name = $1,
                url = $2,
                client_id = $3
            WHERE id = $4
            RETURNING id, name, url, client_id, archived_at, created_at, user_id
        `,
        [nextName, nextUrl, nextClientId, id]
    );

    return mapProjectRow(result.rows[0]);
}

async function getProjectOwnerId(id: string): Promise<string | undefined> {
    const result = await pool.query<{ user_id: string }>(
        `
            SELECT user_id
            FROM projects
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );

    return result.rows[0]?.user_id;
}

async function archiveProjectById(id: string): Promise<Project | undefined> {
    const result = await pool.query<ProjectRow>(
        `
            UPDATE projects
            SET archived_at = COALESCE(archived_at, NOW())
            WHERE id = $1
            RETURNING id, name, url, client_id, archived_at, created_at, user_id
        `,
        [id]
    );
    const row = result.rows[0];

    return row ? mapProjectRow(row) : undefined;
}

async function restoreProjectById(id: string): Promise<Project | undefined> {
    const result = await pool.query<ProjectRow>(
        `
            UPDATE projects
            SET archived_at = NULL
            WHERE id = $1
            RETURNING id, name, url, client_id, archived_at, created_at, user_id
        `,
        [id]
    );
    const row = result.rows[0];

    return row ? mapProjectRow(row) : undefined;
}

export {
    archiveProjectById,
    createNewProject,
    deleteProjectById,
    getAllProjects,
    getPaginatedProjects,
    getProjectById,
    getProjectOwnerId,
    restoreProjectById,
    updateProjectById
};
