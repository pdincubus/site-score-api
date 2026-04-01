import dotenv from 'dotenv';

dotenv.config();

const port = Number(process.env.PORT);
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

const env = {
    port: Number.isNaN(port) ? 3000 : port,
    databaseUrl
};

export { env };