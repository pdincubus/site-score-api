import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import {
    archiveClientById,
    createNewClient,
    deleteClientById,
    getClientById as getClientByIdFromService,
    getPaginatedClients,
    restoreClientById,
    updateClientById
} from '../services/client-service.js';
import { getClientListQuery } from '../utils/pagination.js';
import { createClientSchema, updateClientSchema } from '../validation/client-schemas.js';

function getSingleParam(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

async function getClients(req: Request, res: Response) {
    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const query = getClientListQuery(req.query as Record<string, unknown>);
    const clients = await getPaginatedClients(query);

    res.status(200).json(clients);
}

async function getClientById(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const client = await getClientByIdFromService(id);

    if (!client) {
        throw new AppError('Client not found', 404);
    }

    res.status(200).json(client);
}

async function createClient(req: Request, res: Response) {
    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const { name } = createClientSchema.parse(req.body);
        const client = await createNewClient({
            name,
            userId: req.currentUser.id
        });

        res.status(201).json(client);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function updateClient(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    try {
        const { name } = updateClientSchema.parse(req.body);

        const client = await updateClientById(id, { name });

        if (!client) {
            throw new AppError('Client not found', 404);
        }

        res.status(200).json(client);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new AppError(error.issues[0]?.message || 'Invalid request body', 400);
        }

        throw error;
    }
}

async function archiveClient(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const client = await archiveClientById(id);

    if (!client) {
        throw new AppError('Client not found', 404);
    }

    res.status(200).json(client);
}

async function restoreClient(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const client = await restoreClientById(id);

    if (!client) {
        throw new AppError('Client not found', 404);
    }

    res.status(200).json(client);
}

async function deleteClient(req: Request, res: Response) {
    const id = getSingleParam(req.params.id);

    if (!req.currentUser) {
        throw new AppError('Not authenticated', 401);
    }

    const wasDeleted = await deleteClientById(id);

    if (!wasDeleted) {
        throw new AppError('Client not found', 404);
    }

    res.status(204).send();
}

export {
    archiveClient,
    createClient,
    deleteClient,
    getClientById,
    getClients,
    restoreClient,
    updateClient
};
