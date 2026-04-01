import type { User } from './user.js';

declare global {
    namespace Express {
        interface Request {
            currentUser?: User;
            sessionToken?: string;
        }
    }
}

export {};