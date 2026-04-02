type PaginationQuery = {
    page: number;
    limit: number;
    offset: number;
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

function getPaginationQuery(query: Record<string, unknown>, defaultLimit = 10, maxLimit = 100): PaginationQuery {
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

export { getPaginationQuery };