import { pool } from '../db/database.js';
import type {
    Dashboard,
    DashboardClient,
    DashboardProject,
    DashboardResult
} from '../types/dashboard.js';

type DashboardClientRow = Omit<DashboardClient, 'createdAt'> & {
    created_at: Date;
};

type DashboardProjectRow = {
    id: string;
    name: string;
    client_id: string | null;
    client_name: string | null;
    created_at: Date;
};

type DashboardResultRow = {
    id: string;
    title: string;
    project_id: string;
    project_name: string;
    client_id: string | null;
    client_name: string | null;
    created_at: Date;
};

async function getDashboard(): Promise<Dashboard> {
    const [clientsResult, projectsResult, resultsResult] = await Promise.all([
        pool.query<DashboardClientRow>(
            `
                SELECT id, name, created_at
                FROM clients
                WHERE archived_at IS NULL
                ORDER BY created_at DESC, id DESC
                LIMIT 5
            `
        ),
        pool.query<DashboardProjectRow>(
            `
                SELECT
                    p.id,
                    p.name,
                    p.client_id,
                    c.name AS client_name,
                    p.created_at
                FROM projects p
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE p.archived_at IS NULL
                ORDER BY p.created_at DESC, p.id DESC
                LIMIT 5
            `
        ),
        pool.query<DashboardResultRow>(
            `
                SELECT
                    r.id,
                    r.title,
                    r.project_id,
                    p.name AS project_name,
                    p.client_id,
                    c.name AS client_name,
                    r.created_at
                FROM reports r
                JOIN projects p ON p.id = r.project_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE r.archived_at IS NULL
                  AND p.archived_at IS NULL
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT 5
            `
        )
    ]);

    return {
        clients: clientsResult.rows.map((row) => ({
            id: row.id,
            name: row.name,
            createdAt: row.created_at.toISOString()
        })),
        projects: projectsResult.rows.map((row) => ({
            id: row.id,
            name: row.name,
            clientId: row.client_id,
            clientName: row.client_name,
            createdAt: row.created_at.toISOString()
        })),
        results: resultsResult.rows.map((row) => ({
            id: row.id,
            title: row.title,
            projectId: row.project_id,
            projectName: row.project_name,
            clientId: row.client_id,
            clientName: row.client_name,
            createdAt: row.created_at.toISOString()
        }))
    };
}

export { getDashboard };
