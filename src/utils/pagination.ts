type PaginationQuery = {
    page: number;
    limit: number;
    offset: number;
};

type ProjectListQuery = PaginationQuery & {
    search: string;
    sort: 'createdAt' | 'name';
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

    return {
        ...pagination,
        search,
        sort,
        order
    };
}

export { getPaginationQuery, getProjectListQuery };
export type { PaginationQuery, ProjectListQuery };