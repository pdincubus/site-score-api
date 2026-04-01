import { Pool } from 'pg';
import { env } from '../config/env.js';

const connectionString =
    env.nodeEnv === 'test' && env.databaseTestUrl
        ? env.databaseTestUrl
        : env.databaseUrl;

const pool = new Pool({
    connectionString
});

export { pool };