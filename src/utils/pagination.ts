type PaginationQuery = {
    page: number;
    limit: number;
    offset: number;
};

type ArchiveStatus = 'active' | 'archived' | 'all';

type ProjectListQuery = PaginationQuery & {
    search: string;
    clientId: string | null | undefined;
    status: ArchiveStatus;
    sort: 'createdAt' | 'name';
    order: 'asc' | 'desc';
};

type ClientListQuery = PaginationQuery & {
    search: string;
    status: ArchiveStatus;
    sort: 'createdAt' | 'name';
    order: 'asc' | 'desc';
};

type ReportListQuery = PaginationQuery & {
    search: string;
    groupId: string;
    status: ArchiveStatus;
    sort: 'createdAt' | 'title';
    order: 'asc' | 'desc';
};

function parsePositiveInteger(value: unknown, fallback: number): number {
    if (typeof value !== 'string') {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
}

function getPaginationQuery(
    query: Record<string, unknown>,
    defaultLimit = 10,
    maxLimit = 100
): PaginationQuery {
    const page = parsePositiveInteger(query.page, 1);
    const requestedLimit = parsePositiveInteger(query.limit, defaultLimit);
    const limit = Math.min(requestedLimit, maxLimit);
    const offset = (page - 1) * limit;

    return {
        page,
        limit,
        offset
    };
}

function getProjectListQuery(query: Record<string, unknown>): ProjectListQuery {
    const pagination = getPaginationQuery(query);

    const search =
        typeof query.search === 'string'
            ? query.search.trim()
            : '';

    const sort =
        query.sort === 'name' || query.sort === 'createdAt'
            ? query.sort
            : 'createdAt';

    const order =
        query.order === 'asc' || query.order === 'desc'
            ? query.order
            : 'desc';

    const status = getArchiveStatus(query.status);
    const rawClientId = typeof query.clientId === 'string' ? query.clientId.trim() : '';
    const clientId = rawClientId === '' ? undefined : rawClientId === 'unassigned' ? null : rawClientId;

    return {
        ...pagination,
        search,
        clientId,
        status,
        sort,
        order
    };
}

function getClientListQuery(query: Record<string, unknown>): ClientListQuery {
    const pagination = getPaginationQuery(query);

    const search =
        typeof query.search === 'string'
            ? query.search.trim()
            : '';

    const sort =
        query.sort === 'name' || query.sort === 'createdAt'
            ? query.sort
            : 'createdAt';

    const order =
        query.order === 'asc' || query.order === 'desc'
            ? query.order
            : 'desc';

    const status = getArchiveStatus(query.status);

    return {
        ...pagination,
        search,
        status,
        sort,
        order
    };
}

function getReportListQuery(query: Record<string, unknown>): ReportListQuery {
    const pagination = getPaginationQuery(query);

    const search =
        typeof query.search === 'string'
            ? query.search.trim()
            : '';

    const sort =
        query.sort === 'title' || query.sort === 'createdAt'
            ? query.sort
            : 'createdAt';

    const order =
        query.order === 'asc' || query.order === 'desc'
            ? query.order
            : 'desc';

    const groupId =
        typeof query.groupId === 'string'
            ? query.groupId.trim()
            : '';

    const status = getArchiveStatus(query.status);

    return {
        ...pagination,
        search,
        groupId,
        status,
        sort,
        order
    };
}

function getArchiveStatus(value: unknown): ArchiveStatus {
    return value === 'archived' || value === 'all' ? value : 'active';
}

export { getClientListQuery, getPaginationQuery, getProjectListQuery, getReportListQuery };
export type { ArchiveStatus, ClientListQuery, PaginationQuery, ProjectListQuery, ReportListQuery };
