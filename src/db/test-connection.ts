import { pool } from './database.js';

async function testConnection() {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    await pool.end();
}

testConnection().catch((error) => {
    console.error('Database connection failed:', error);
});