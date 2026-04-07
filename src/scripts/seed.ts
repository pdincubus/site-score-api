import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { getSeedPool } from '../db/seed-database.js';

async function seed() {
    const pool = getSeedPool();

    try {
        const email = process.env.SEED_USER_EMAIL;
        const name = process.env.SEED_USER_NAME || 'Admin User';
        const password = process.env.SEED_USER_PASSWORD;

        if (!email || !password) {
            throw new Error('SEED_USER_EMAIL and SEED_USER_PASSWORD must be set');
        }

        const existingUserResult = await pool.query<{ id: string }>(
            `
                SELECT id
                FROM users
                WHERE email = $1
                LIMIT 1
            `,
            [email.toLowerCase()]
        );

        if (existingUserResult.rows[0]) {
            console.log(`Seed user already exists: ${email}`);
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const id = crypto.randomUUID();

        await pool.query(
            `
                INSERT INTO users (id, name, email, password_hash)
                VALUES ($1, $2, $3, $4)
            `,
            [id, name, email.toLowerCase(), passwordHash]
        );

        console.log(`Seeded user: ${email}`);
    } finally {
        await pool.end();
    }
}

seed().catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
});