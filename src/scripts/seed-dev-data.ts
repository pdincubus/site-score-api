import { env } from '../config/env.js';
import { migrationPool } from '../db/migration-database.js';
import { runSeed } from './shared/run-seed.js';

async function seedDevData() {
    if (env.nodeEnv !== 'development') {
        throw new Error('seed-dev-data must only be run with NODE_ENV=development');
    }

    await runSeed(migrationPool, 'dev');
}

seedDevData().catch((error) => {
    console.error('Seeding dev data failed:', error);
    process.exitCode = 1;
});