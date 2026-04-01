import express from 'express';
import { errorMiddleware, notFoundMiddleware } from './middleware/error-middleware.js';
import { requestLogger } from './middleware/request-logger.js';
import { projectRoutes } from './routes/project-routes.js';

const app = express();

app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
    res.status(200).json({
        ok: true
    });
});

app.use('/projects', projectRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export { app };