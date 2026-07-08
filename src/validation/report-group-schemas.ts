import { z } from 'zod';
import { pageSpeedStrategySchema } from './report-insights-schema.js';
import { publicHttpUrlSchema } from './url-schemas.js';

const createReportGroupSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
    pageUrl: publicHttpUrlSchema,
    strategy: pageSpeedStrategySchema
}).strict();

export { createReportGroupSchema };
