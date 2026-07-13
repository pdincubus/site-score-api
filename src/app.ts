import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './config/openapi.js';
import cors from 'cors';

import { env } from './config/env.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error-middleware.js';
import { createRateLimit } from './middleware/rate-limit.js';
import { requestLogger } from './middleware/request-logger.js';
import { securityHeaders } from './middleware/security-headers.js';
import { clientRoutes } from './routes/client-routes.js';
import { dashboardRoutes } from './routes/dashboard-routes.js';
import { projectRoutes } from './routes/project-routes.js';
import { authRoutes } from './routes/auth-routes.js';
import { reportRoutes } from './routes/report-routes.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.isProduction ? 1 : false);

const allowedOrigins = [
    'http://localhost:5173',
    'https://site-score-ui.vercel.app'
];

const authRateLimit = createRateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === 'test' ? 1000 : 20,
    message: 'Too many authentication attempts, please try again later'
});

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'));
        },
        credentials: true
    })
);

app.use(securityHeaders);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(requestLogger);

app.get('/', (_req, res) => {
    res.status(200).json({
        name: 'Site Score API',
        status: 'ok',
        docs: '/docs',
        endpoints: {
            auth: '/auth',
            dashboard: '/dashboard',
            clients: '/clients',
            projects: '/projects',
            reports: '/reports/:id'
        }
    });
});

app.use('/dashboard', dashboardRoutes);
app.use('/clients', clientRoutes);
app.use('/projects', projectRoutes);
app.use('/auth/login', authRateLimit);
app.use('/auth/register', authRateLimit);
app.use('/auth', authRoutes);
app.use(reportRoutes);

app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
        customSiteTitle: 'Site Score API Docs',
        explorer: true,
        swaggerOptions: {
            docExpansion: 'list',
            defaultModelsExpandDepth: 1
        }
    })
);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };
