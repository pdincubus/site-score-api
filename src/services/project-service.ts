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


async function getAllProjects(): Promise<Project[]> {
    const result = await pool.query(`
        SELECT id, name, url, created_at
        FROM projects
        ORDER BY created_at DESC
    `);

    return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        url: row.url,
        createdAt: row.created_at.toISOString()
    }));
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

    return {
        id: row.id,
        name: row.name,
        url: row.url,
        createdAt: row.created_at.toISOString()
    };
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

    const row = result.rows[0];

    return {
        id: row.id,
        name: row.name,
        url: row.url,
        createdAt: row.created_at.toISOString()
    };
}

export { getAllProjects, getProjectById, createNewProject };