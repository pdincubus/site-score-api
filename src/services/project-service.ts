import crypto from 'node:crypto';
import { pool } from '../db/database.js';
import { AppError } from '../errors/app-error.js';
import type { Project } from '../types/project.js';

type CreateProjectInput = {
    name: string;
    url: string;
};

type ProjectRow = {
    id: string;
    name: string;
    url: string;
    created_at: Date;
};

type UpdateProjectInput = {
    name?: string;
    url?: string;
};

function mapProjectRow(row: ProjectRow): Project {
    return {
        id: row.id,
        name: row.name,
        url: row.url,
        createdAt: row.created_at.toISOString()
    };
}

async function getAllProjects(): Promise<Project[]> {
    const result = await pool.query<ProjectRow>(
        `
            SELECT id, name, url, created_at
            FROM projects
            ORDER BY created_at DESC
        `
    );

    return result.rows.map(mapProjectRow);
}

async function getProjectById(id: string): Promise<Project | undefined> {
    const result = await pool.query<ProjectRow>(
        `
            SELECT id, name, url, created_at
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
            INSERT INTO projects (id, name, url)
            VALUES ($1, $2, $3)
            RETURNING id, name, url, created_at
        `,
        [id, trimmedName, trimmedUrl]
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
            SELECT id, name, url, created_at
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
                url = $2
            WHERE id = $3
            RETURNING id, name, url, created_at
        `,
        [nextName, nextUrl, id]
    );

    return mapProjectRow(result.rows[0]);
}

export { getAllProjects, getProjectById, createNewProject, deleteProjectById, updateProjectById };