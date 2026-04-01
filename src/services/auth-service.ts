import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { pool } from '../db/database.js';
import { AppError } from '../errors/app-error.js';
import type { User } from '../types/user.js';

type UserRow = {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    created_at: Date;
};

function mapUserRow(row: UserRow): User {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: row.created_at.toISOString()
    };
}

type RegisterInput = {
    name: string;
    email: string;
    password: string;
};

type SessionRow = {
    id: string;
    user_id: string;
    token: string;
    created_at: Date;
    expires_at: Date;
};

type LoginInput = {
    email: string;
    password: string;
};

function addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

async function registerUser(input: RegisterInput): Promise<User> {
    const trimmedName = input.name.trim();
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedPassword = input.password.trim();

    const existingUserResult = await pool.query<{ id: string }>(
        `
            SELECT id
            FROM users
            WHERE email = $1
            LIMIT 1
        `,
        [trimmedEmail]
    );

    if (existingUserResult.rows[0]) {
        throw new AppError('A user with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 10);
    const id = crypto.randomUUID();

    const result = await pool.query<UserRow>(
        `
            INSERT INTO users (id, name, email, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, password_hash, created_at
        `,
        [id, trimmedName, trimmedEmail, passwordHash]
    );

    return mapUserRow(result.rows[0]);
}

async function loginUser(input: LoginInput): Promise<{ user: User; sessionToken: string }> {
    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedPassword = input.password.trim();

    const userResult = await pool.query<UserRow>(
        `
            SELECT id, name, email, password_hash, created_at
            FROM users
            WHERE email = $1
            LIMIT 1
        `,
        [trimmedEmail]
    );

    const userRow = userResult.rows[0];

    if (!userRow) {
        throw new AppError('Invalid email or password', 401);
    }

    const passwordMatches = await bcrypt.compare(trimmedPassword, userRow.password_hash);

    if (!passwordMatches) {
        throw new AppError('Invalid email or password', 401);
    }

    const sessionId = crypto.randomUUID();
    const sessionToken = crypto.randomUUID();
    const expiresAt = addDays(new Date(), 7);

    await pool.query(
        `
            INSERT INTO sessions (id, user_id, token, expires_at)
            VALUES ($1, $2, $3, $4)
        `,
        [sessionId, userRow.id, sessionToken, expiresAt]
    );

    return {
        user: mapUserRow(userRow),
        sessionToken
    };
}

async function getUserBySessionToken(token: string): Promise<User | undefined> {
    const result = await pool.query<UserRow>(
        `
            SELECT u.id, u.name, u.email, u.password_hash, u.created_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = $1
              AND s.expires_at > NOW()
            LIMIT 1
        `,
        [token]
    );

    const userRow = result.rows[0];

    if (!userRow) {
        return undefined;
    }

    return mapUserRow(userRow);
}

async function deleteSessionByToken(token: string): Promise<void> {
    await pool.query(
        `
            DELETE FROM sessions
            WHERE token = $1
        `,
        [token]
    );
}

export { mapUserRow, registerUser, loginUser, getUserBySessionToken, deleteSessionByToken };