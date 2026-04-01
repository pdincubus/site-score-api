import { pool } from '../db/database.js';

async function clearProjectsTable() {
    await pool.query('DELETE FROM projects');
}

export { clearProjectsTable };