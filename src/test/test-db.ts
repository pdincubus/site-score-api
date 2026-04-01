import { pool } from '../db/database.js';

async function clearTables() {
    await pool.query('DELETE FROM sessions');
    await pool.query('DELETE FROM projects');
    await pool.query('DELETE FROM users');
}

export { clearTables };