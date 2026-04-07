import { Pool } from 'pg';
import { env } from '../config/env.js';

function getSeedConnectionString(): string {
    if (env.seedDatabaseUrl) {
        return env.seedDatabaseUrl;
    }

    if (env.nodeEnv === 'test' && env.databaseTestUrl) {
        return env.databaseTestUrl;
    }

    return env.databaseUrl;
}

function getSeedPool(): Pool {
    return new Pool({
        connectionString: getSeedConnectionString()
    });
}

export { getSeedConnectionString, getSeedPool };
