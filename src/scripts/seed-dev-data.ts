import { env } from '../config/env.js';
import { getSeedPool } from '../db/seed-database.js';
import { runSeed } from './shared/run-seed.js';

async function seedDevData() {
    if (env.nodeEnv !== 'development') {
        throw new Error('seed-dev-data must only be run with NODE_ENV=development');
    }

    const pool = getSeedPool();

    await runSeed(pool, 'dev');
}

seedDevData().catch((error) => {
    console.error('Seeding dev data failed:', error);
    process.exitCode = 1;
});