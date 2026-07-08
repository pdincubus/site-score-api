import { z } from 'zod';
import { pageSpeedStrategySchema } from './report-insights-schema.js';
import { publicHttpUrlSchema } from './url-schemas.js';

const reportInsightImportSchema = z.object({
    source: z.literal('PAGESPEED'),
    url: publicHttpUrlSchema,
    strategy: pageSpeedStrategySchema
}).strict();

export { reportInsightImportSchema };
