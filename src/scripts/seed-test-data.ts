import { env } from '../config/env.js';
import { getSeedPool } from '../db/seed-database.js';
import { runSeed } from './shared/run-seed.js';

async function seedTestData() {
    if (env.nodeEnv !== 'test') {
        throw new Error('seed-test-data must only be run with NODE_ENV=test');
    }

    const pool = getSeedPool();

    await runSeed(pool, 'test');
}

seedTestData().catch((error) => {
    console.error('Seeding test data failed:', error);
    process.exitCode = 1;
});