import crypto from 'node:crypto';
import { pool } from '../db/database.js';
import type { Client } from '../types/client.js';
import type { PaginatedResponse } from '../types/pagination.js';
import type { ClientListQuery } from '../utils/pagination.js';

type CreateClientInput = {
    name: string;
    userId: string;
};

type UpdateClientInput = {
    name: string;
};

type ClientRow = {
    id: string;
    user_id: string;
    name: string;
    archived_at: Date | null;
    created_at: Date;
};

function mapClientRow(row: ClientRow): Client {
    return {
        id: row.id,
        name: row.name,
        archivedAt: row.archived_at?.toISOString() ?? null,
        createdAt: row.created_at.toISOString()
    };
}

async function getPaginatedClients(query: ClientListQuery): Promise<PaginatedResponse<Client>> {
    const sortColumn = query.sort === 'name' ? 'c.name' : 'c.created_at';
    const sortOrder = query.order === 'asc' ? 'ASC' : 'DESC';
    const conditions: string[] = [];
    const params: unknown[] = [];
    const searchTerm = query.search.trim();

    if (searchTerm !== '') {
        params.push(`%${searchTerm}%`);
        conditions.push(`c.name ILIKE $${params.length}`);
    }

    if (query.status === 'active') {
        conditions.push('c.archived_at IS NULL');
    }

    if (query.status === 'archived') {
        conditions.push('c.archived_at IS NOT NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const totalResult = await pool.query<{ count: string }>(
        `
            SELECT COUNT(*) AS count
            FROM clients c
            ${whereClause}
        `,
        params
    );
    const total = Number(totalResult.rows[0]?.count ?? 0);
    const dataParams = [...params, query.limit, query.offset];
    const limitParam = params.length + 1;
    const offsetParam = params.length + 2;
    const result = await pool.query<ClientRow>(
        `
            SELECT id, user_id, name, archived_at, created_at
            FROM clients c
            ${whereClause}
            ORDER BY ${sortColumn} ${sortOrder}
            LIMIT $${limitParam}
            OFFSET $${offsetParam}
        `,
        dataParams
    );

    return {
        data: result.rows.map(mapClientRow),
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / query.limit)
        }
    };
}

async function getClientById(id: string): Promise<Client | undefined> {
    const result = await pool.query<ClientRow>(
        `
            SELECT id, user_id, name, archived_at, created_at
            FROM clients
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );
    const row = result.rows[0];

    return row ? mapClientRow(row) : undefined;
}

async function createNewClient(input: CreateClientInput): Promise<Client> {
    const id = crypto.randomUUID();
    const result = await pool.query<ClientRow>(
        `
            INSERT INTO clients (id, user_id, name)
            VALUES ($1, $2, $3)
            RETURNING id, user_id, name, archived_at, created_at
        `,
        [
            id,
            input.userId,
            input.name.trim()
        ]
    );

    return mapClientRow(result.rows[0]);
}

async function updateClientById(id: string, input: UpdateClientInput): Promise<Client | undefined> {
    const result = await pool.query<ClientRow>(
        `
            UPDATE clients
            SET name = $1
            WHERE id = $2
            RETURNING id, user_id, name, archived_at, created_at
        `,
        [
            input.name.trim(),
            id
        ]
    );
    const row = result.rows[0];

    return row ? mapClientRow(row) : undefined;
}

async function archiveClientById(id: string): Promise<Client | undefined> {
    const result = await pool.query<ClientRow>(
        `
            UPDATE clients
            SET archived_at = COALESCE(archived_at, NOW())
            WHERE id = $1
            RETURNING id, user_id, name, archived_at, created_at
        `,
        [id]
    );
    const row = result.rows[0];

    return row ? mapClientRow(row) : undefined;
}

async function restoreClientById(id: string): Promise<Client | undefined> {
    const result = await pool.query<ClientRow>(
        `
            UPDATE clients
            SET archived_at = NULL
            WHERE id = $1
            RETURNING id, user_id, name, archived_at, created_at
        `,
        [id]
    );
    const row = result.rows[0];

    return row ? mapClientRow(row) : undefined;
}

async function deleteClientById(id: string): Promise<boolean> {
    const result = await pool.query(
        `
            DELETE FROM clients
            WHERE id = $1
        `,
        [id]
    );

    return (result.rowCount ?? 0) > 0;
}

async function getClientOwnerId(id: string): Promise<string | undefined> {
    const result = await pool.query<{ user_id: string }>(
        `
            SELECT user_id
            FROM clients
            WHERE id = $1
            LIMIT 1
        `,
        [id]
    );

    return result.rows[0]?.user_id;
}

export {
    archiveClientById,
    createNewClient,
    deleteClientById,
    getClientById,
    getClientOwnerId,
    getPaginatedClients,
    restoreClientById,
    updateClientById
};
