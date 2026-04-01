import { Router } from 'express';

import {
    getCurrentUser,
    login,
    logout,
    register
} from '../controllers/auth-controller.js';

import { asyncHandler } from '../middleware/async-handler.js';

const authRoutes = Router();

authRoutes.post('/register', asyncHandler(register));
authRoutes.post('/login', asyncHandler(login));
authRoutes.post('/logout', asyncHandler(logout));
authRoutes.get('/me', asyncHandler(getCurrentUser));

export { authRoutes };