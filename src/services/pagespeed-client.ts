import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import type { PageSpeedStrategy, ReportInsights } from '../types/report-insights.js';
import { normalisePageSpeedResponse } from './pagespeed-normaliser.js';

type FetchPageSpeedInput = {
    url: string;
    strategy: PageSpeedStrategy;
};

type FetchPageSpeedOptions = {
    apiKey?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    now?: () => Date;
};

type BuildPageSpeedRequestUrlInput = FetchPageSpeedInput & {
    apiKey?: string;
};

const pageSpeedEndpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const pageSpeedCategories = ['performance', 'accessibility', 'best-practices', 'seo'];

function buildPageSpeedRequestUrl(input: BuildPageSpeedRequestUrlInput): URL {
    const requestUrl = new URL(pageSpeedEndpoint);

    requestUrl.searchParams.set('url', input.url);
    requestUrl.searchParams.set('strategy', input.strategy);

    for (const category of pageSpeedCategories) {
        requestUrl.searchParams.append('category', category);
    }

    if (input.apiKey) {
        requestUrl.searchParams.set('key', input.apiKey);
    }

    return requestUrl;
}

async function fetchPageSpeedInsights(
    input: FetchPageSpeedInput,
    options: FetchPageSpeedOptions = {}
): Promise<ReportInsights> {
    const fetchImpl = options.fetchImpl || fetch;
    const now = options.now || (() => new Date());
    const requestUrl = buildPageSpeedRequestUrl({
        ...input,
        apiKey: options.apiKey ?? env.pageSpeedApiKey
    });
    const timeoutMs = options.timeoutMs ?? env.pageSpeedTimeoutMs;

    try {
        const response = await fetchImpl(requestUrl, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            signal: AbortSignal.timeout(timeoutMs)
        });

        if (response.status === 429) {
            throw new AppError('PageSpeed quota or rate limit reached', 429);
        }

        if (!response.ok) {
            throw new AppError('PageSpeed is unavailable', 502);
        }

        const responseBody = await response.json();

        return normalisePageSpeedResponse(responseBody, {
            testedUrl: input.url,
            strategy: input.strategy,
            fetchedAt: now()
        });
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
            throw new AppError('PageSpeed timed out', 504);
        }

        throw new AppError('PageSpeed is unavailable', 502);
    }
}

export { buildPageSpeedRequestUrl, fetchPageSpeedInsights };
