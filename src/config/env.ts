import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT);
const databaseUrl = process.env.DATABASE_URL;
const databaseTestUrl = process.env.DATABASE_TEST_URL;
const sessionSecret = process.env.SESSION_SECRET;
const seedUserName = process.env.SEED_USER_NAME;
const seedUserEmail = process.env.SEED_USER_EMAIL;
const seedUserPassword = process.env.SEED_USER_PASSWORD;
const seedDatabaseUrl = process.env.SEED_DATABASE_URL?.trim() || '';
const nodeEnv = process.env.NODE_ENV || 'development';

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not set');
}

if (nodeEnv === 'test' && !databaseTestUrl) {
    throw new Error('DATABASE_TEST_URL is not set');
}

const databaseMigrationUrl =
    nodeEnv === 'test'
        ? databaseTestUrl || ''
        : process.env.DATABASE_MIGRATION_URL || databaseUrl;

const env = {
    port: Number.isNaN(port) ? 3000 : port,
    nodeEnv,
    isProduction: nodeEnv === 'production',
    databaseUrl,
    databaseTestUrl: databaseTestUrl || '',
    databaseMigrationUrl,
    sessionSecret,
    seedUserName: seedUserName || '',
    seedUserEmail: seedUserEmail || '',
    seedUserPassword: seedUserPassword || '',
    seedDatabaseUrl
};

export { env };