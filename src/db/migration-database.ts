import { Pool } from 'pg';
import { env } from '../config/env.js';

const migrationPool = new Pool({
    connectionString: env.databaseMigrationUrl
});

export { migrationPool };