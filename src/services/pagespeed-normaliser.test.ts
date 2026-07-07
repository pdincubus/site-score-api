import { describe, expect, it } from 'vitest';
import { normalisePageSpeedResponse } from './pagespeed-normaliser.js';

describe('normalisePageSpeedResponse', () => {
    it('converts Lighthouse category scores from 0..1 to 0..100', () => {
        const result = normalisePageSpeedResponse(
            {
                lighthouseResult: {
                    finalDisplayedUrl: 'https://example.com/',
                    lighthouseVersion: '13.0.0',
                    categories: {
                        performance: {
                            score: 0.94
                        },
                        accessibility: {
                            score: 0.98
                        },
                        'best-practices': {
                            score: 0.92
                        },
                        seo: {
                            score: 1
                        }
                    },
                    audits: {}
                }
            },
            {
                testedUrl: 'https://example.com/',
                strategy: 'mobile',
                fetchedAt: new Date('2026-07-07T12:00:00.000Z')
            }
        );

        expect(result.scores).toEqual({
            performance: 94,
            accessibility: 98,
            bestPractices: 92,
            seo: 100
        });
    });

    it('returns null for missing or malformed metric values', () => {
        const result = normalisePageSpeedResponse(
            {
                lighthouseResult: {
                    categories: {},
                    audits: {
                        'largest-contentful-paint': {
                            numericValue: 'not-a-number',
                            displayValue: 1800
                        },
                        'cumulative-layout-shift': {
                            displayValue: '0.02'
                        }
                    }
                }
            },
            {
                testedUrl: 'https://example.com/',
                strategy: 'desktop',
                fetchedAt: new Date('2026-07-07T12:00:00.000Z')
            }
        );

        expect(result.metrics.largestContentfulPaint).toEqual({
            value: null,
            unit: 'ms',
            displayValue: null,
            category: null
        });
        expect(result.metrics.cumulativeLayoutShift).toEqual({
            value: null,
            unit: 'unitless',
            displayValue: '0.02',
            category: null
        });
    });

    it('sorts opportunities by savings and limits them to five', () => {
        const result = normalisePageSpeedResponse(
            {
                lighthouseResult: {
                    categories: {},
                    audits: {
                        small: {
                            id: 'small',
                            title: 'Small saving',
                            displayValue: 'Potential savings of 20 ms',
                            score: 0.8,
                            details: {
                                type: 'opportunity',
                                overallSavingsMs: 20
                            }
                        },
                        missingSavings: {
                            id: 'missingSavings',
                            title: 'Missing saving',
                            details: {
                                type: 'opportunity'
                            }
                        },
                        largest: {
                            id: 'largest',
                            title: 'Largest saving',
                            displayValue: 'Potential savings of 600 ms',
                            score: 0.5,
                            details: {
                                type: 'opportunity',
                                overallSavingsMs: 600
                            }
                        },
                        second: {
                            id: 'second',
                            title: 'Second saving',
                            details: {
                                type: 'opportunity',
                                overallSavingsMs: 500
                            }
                        },
                        third: {
                            id: 'third',
                            title: 'Third saving',
                            details: {
                                type: 'opportunity',
                                overallSavingsMs: 400
                            }
                        },
                        fourth: {
                            id: 'fourth',
                            title: 'Fourth saving',
                            details: {
                                type: 'opportunity',
                                overallSavingsMs: 300
                            }
                        },
                        fifth: {
                            id: 'fifth',
                            title: 'Fifth saving',
                            details: {
                                type: 'opportunity',
                                overallSavingsMs: 200
                            }
                        },
                        sixth: {
                            id: 'sixth',
                            title: 'Sixth saving',
                            details: {
                                type: 'opportunity',
                                overallSavingsMs: 100
                            }
                        }
                    }
                }
            },
            {
                testedUrl: 'https://example.com/',
                strategy: 'mobile',
                fetchedAt: new Date('2026-07-07T12:00:00.000Z')
            }
        );

        expect(result.opportunities.map((opportunity) => opportunity.id)).toEqual([
            'largest',
            'second',
            'third',
            'fourth',
            'fifth'
        ]);
    });
});
