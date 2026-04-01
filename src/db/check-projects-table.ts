import { pool } from './database.js';

async function checkProjectsTable() {
    const result = await pool.query('SELECT * FROM projects');
    console.log(result.rows);
    await pool.end();
}

checkProjectsTable().catch((error) => {
    console.error('Projects table check failed:', error);
});