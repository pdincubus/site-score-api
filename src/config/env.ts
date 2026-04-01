import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT);
const databaseUrl = process.env.DATABASE_URL;
const databaseTestUrl = process.env.DATABASE_TEST_URL;
const sessionSecret = process.env.SESSION_SECRET;
const nodeEnv = process.env.NODE_ENV || 'development';

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not set');
}

const env = {
    port: Number.isNaN(port) ? 3000 : port,
    nodeEnv,
    databaseUrl,
    databaseTestUrl: databaseTestUrl || '',
    sessionSecret
};

export { env };