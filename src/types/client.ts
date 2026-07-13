type Client = {
    id: string;
    name: string;
    archivedAt: string | null;
    createdAt: string;
};

type ClientSummary = {
    projectCount: number;
    reportCount: number;
};

type ClientListItem = Client & {
    summary: ClientSummary;
};

export type { Client, ClientListItem, ClientSummary };
