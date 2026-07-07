import net from 'node:net';
import { z } from 'zod';
import { pageSpeedStrategySchema } from './report-insights-schema.js';

function normaliseHostname(hostname: string): string {
    return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

function isPrivateIpv4(hostname: string): boolean {
    const parts = hostname.split('.').map((part) => Number(part));

    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
        return false;
    }

    const [first, second] = parts;

    return (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168)
    );
}

function isPublicHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        const hostname = normaliseHostname(url.hostname);

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return false;
        }

        if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
            return false;
        }

        if (hostname === '::1') {
            return false;
        }

        return net.isIP(hostname) === 4 ? !isPrivateIpv4(hostname) : true;
    } catch {
        return false;
    }
}

const reportInsightImportSchema = z.object({
    source: z.literal('PAGESPEED'),
    url: z.string()
        .trim()
        .min(1, 'URL is required')
        .max(2048, 'URL must be 2048 characters or fewer')
        .refine(isPublicHttpUrl, 'URL must be a public absolute http or https URL'),
    strategy: pageSpeedStrategySchema
}).strict();

export { reportInsightImportSchema };
