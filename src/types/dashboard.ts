type DashboardClient = {
    id: string;
    name: string;
    createdAt: string;
};

type DashboardProject = {
    id: string;
    name: string;
    clientId: string | null;
    clientName: string | null;
    createdAt: string;
};

type DashboardResult = {
    id: string;
    title: string;
    projectId: string;
    projectName: string;
    clientId: string | null;
    clientName: string | null;
    createdAt: string;
};

type Dashboard = {
    clients: DashboardClient[];
    projects: DashboardProject[];
    results: DashboardResult[];
};

export type { Dashboard, DashboardClient, DashboardProject, DashboardResult };
