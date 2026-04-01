import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT);
const databaseUrl = process.env.DATABASE_URL;
const databaseTestUrl = process.env.DATABASE_TEST_URL;
const nodeEnv = process.env.NODE_ENV || 'development';

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

const env = {
    port: Number.isNaN(port) ? 3000 : port,
    nodeEnv,
    databaseUrl,
    databaseTestUrl: databaseTestUrl || ''
};

export { env };