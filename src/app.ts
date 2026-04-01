import express from 'express';
import cookieParser from 'cookie-parser';

import { errorMiddleware, notFoundMiddleware } from './middleware/error-middleware.js';
import { requestLogger } from './middleware/request-logger.js';
import { projectRoutes } from './routes/project-routes.js';
import { authRoutes } from './routes/auth-routes.js';
import { reportRoutes } from './routes/report-routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.get('/health', (_req, res) => {
    res.status(200).json({
        ok: true
    });
});

app.use('/projects', projectRoutes);
app.use('/auth', authRoutes);
app.use(reportRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };