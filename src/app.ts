import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './config/openapi.js';

import { errorMiddleware, notFoundMiddleware } from './middleware/error-middleware.js';
import { requestLogger } from './middleware/request-logger.js';
import { projectRoutes } from './routes/project-routes.js';
import { authRoutes } from './routes/auth-routes.js';
import { reportRoutes } from './routes/report-routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get('/', (_req, res) => {
    res.status(200).json({
        name: 'Site Score API',
        status: 'ok',
        docs: '/docs',
        endpoints: {
            auth: '/auth',
            projects: '/projects',
            reports: '/reports/:id'
        }
    });
});

app.use('/projects', projectRoutes);
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