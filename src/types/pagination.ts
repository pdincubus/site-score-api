type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

type PaginatedResponse<T> = {
    data: T[];
    pagination: PaginationMeta;
};

export type { PaginationMeta, PaginatedResponse };