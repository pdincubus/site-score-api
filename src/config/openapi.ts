import swaggerJSDoc from 'swagger-jsdoc';

const openApiSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Site Score API',
            version: '1.0.0',
            description: 'API for managing users, projects, and reports.'
        },
        tags: [
            {
                name: 'Auth',
                description: 'Authentication and session routes'
            },
            {
                name: 'Projects',
                description: 'Project management routes'
            },
            {
                name: 'Reports',
                description: 'Report management routes'
            }
        ],
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local development'
            },
            {
                url: 'https://site-score-api.onrender.com',
                description: 'Production'
            }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'session_token'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '6f0b0c1c-9c75-4d62-8f1c-2c7ecf0e2c16'
                        },
                        name: {
                            type: 'string',
                            example: 'Phil'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'phil@example.com'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-04-01T13:15:06.935Z'
                        }
                    },
                    required: ['id', 'name', 'email', 'createdAt']
                },
                Project: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '0fd1f6d1-5a7b-4a8a-a7f8-75d1c59c3e1d'
                        },
                        name: {
                            type: 'string',
                            example: 'Site Score'
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-04-01T13:15:06.935Z'
                        }
                    },
                    required: ['id', 'name', 'url', 'createdAt']
                },
                Report: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'f4d90c3c-6577-4cd4-8fc4-5d63c2f8a4a8'
                        },
                        projectId: {
                            type: 'string',
                            example: '0fd1f6d1-5a7b-4a8a-a7f8-75d1c59c3e1d'
                        },
                        title: {
                            type: 'string',
                            example: 'Homepage audit'
                        },
                        summary: {
                            type: 'string',
                            example: 'Initial report for homepage checks'
                        },
                        accessibilityScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 85
                        },
                        performanceScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 90
                        },
                        seoScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 78
                        },
                        uxScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 82
                        },
                        insights: {
                            nullable: true,
                            allOf: [
                                {
                                    $ref: '#/components/schemas/ReportInsights'
                                }
                            ]
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-04-01T13:15:06.935Z'
                        }
                    },
                    required: [
                        'id',
                        'projectId',
                        'title',
                        'summary',
                        'accessibilityScore',
                        'performanceScore',
                        'seoScore',
                        'uxScore',
                        'insights',
                        'createdAt'
                    ]
                },
                ReportInsightMetric: {
                    type: 'object',
                    properties: {
                        value: {
                            type: 'number',
                            nullable: true,
                            example: 1800
                        },
                        unit: {
                            type: 'string',
                            enum: ['ms', 'score', 'unitless'],
                            example: 'ms'
                        },
                        displayValue: {
                            type: 'string',
                            nullable: true,
                            example: '1.8 s'
                        },
                        category: {
                            type: 'string',
                            nullable: true,
                            example: null
                        }
                    },
                    required: ['value', 'unit', 'displayValue']
                },
                ReportInsightMetrics: {
                    type: 'object',
                    properties: {
                        firstContentfulPaint: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        },
                        largestContentfulPaint: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        },
                        cumulativeLayoutShift: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        },
                        totalBlockingTime: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        },
                        speedIndex: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        },
                        timeToInteractive: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        },
                        interactionToNextPaint: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        }
                    }
                },
                ReportInsightOpportunity: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'render-blocking-resources'
                        },
                        title: {
                            type: 'string',
                            example: 'Eliminate render-blocking resources'
                        },
                        displayValue: {
                            type: 'string',
                            nullable: true,
                            example: 'Potential savings of 520 ms'
                        },
                        score: {
                            type: 'number',
                            nullable: true,
                            example: 0.71
                        },
                        overallSavingsMs: {
                            type: 'number',
                            nullable: true,
                            example: 520
                        }
                    },
                    required: ['id', 'title', 'displayValue', 'score', 'overallSavingsMs']
                },
                ReportInsights: {
                    type: 'object',
                    properties: {
                        source: {
                            type: 'string',
                            enum: ['PAGESPEED', 'CRUX'],
                            example: 'PAGESPEED'
                        },
                        strategy: {
                            type: 'string',
                            enum: ['mobile', 'desktop'],
                            example: 'mobile'
                        },
                        testedUrl: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/'
                        },
                        finalUrl: {
                            type: 'string',
                            format: 'uri',
                            nullable: true,
                            example: 'https://example.com/'
                        },
                        fetchedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-07-07T12:00:00.000Z'
                        },
                        lighthouseVersion: {
                            type: 'string',
                            nullable: true,
                            example: '13.0.0'
                        },
                        scores: {
                            type: 'object',
                            properties: {
                                performance: {
                                    type: 'integer',
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 100,
                                    example: 94
                                },
                                accessibility: {
                                    type: 'integer',
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 100,
                                    example: 98
                                },
                                bestPractices: {
                                    type: 'integer',
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 100,
                                    example: 92
                                },
                                seo: {
                                    type: 'integer',
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 100,
                                    example: 100
                                }
                            },
                            required: ['performance', 'accessibility', 'bestPractices', 'seo']
                        },
                        metrics: {
                            $ref: '#/components/schemas/ReportInsightMetrics'
                        },
                        fieldData: {
                            nullable: true,
                            type: 'object',
                            properties: {
                                source: {
                                    type: 'string',
                                    enum: ['PAGESPEED', 'CRUX']
                                },
                                overallCategory: {
                                    type: 'string',
                                    nullable: true
                                },
                                metrics: {
                                    $ref: '#/components/schemas/ReportInsightMetrics'
                                }
                            }
                        },
                        opportunities: {
                            type: 'array',
                            maxItems: 5,
                            items: {
                                $ref: '#/components/schemas/ReportInsightOpportunity'
                            }
                        }
                    },
                    required: [
                        'source',
                        'strategy',
                        'testedUrl',
                        'finalUrl',
                        'fetchedAt',
                        'lighthouseVersion',
                        'scores',
                        'metrics',
                        'opportunities'
                    ]
                },
                ReportInsightImportRequest: {
                    type: 'object',
                    properties: {
                        source: {
                            type: 'string',
                            enum: ['PAGESPEED'],
                            example: 'PAGESPEED'
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                            maxLength: 2048,
                            example: 'https://example.com/'
                        },
                        strategy: {
                            type: 'string',
                            enum: ['mobile', 'desktop'],
                            example: 'mobile'
                        }
                    },
                    required: ['source', 'url', 'strategy']
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            example: 'Not authenticated'
                        }
                    },
                    required: ['error']
                },
                RegisterRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Phil'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'phil@example.com'
                        },
                        password: {
                            type: 'string',
                            example: 'secret123'
                        }
                    },
                    required: ['name', 'email', 'password']
                },
                LoginRequest: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'phil@example.com'
                        },
                        password: {
                            type: 'string',
                            example: 'secret123'
                        }
                    },
                    required: ['email', 'password']
                },
                CreateProjectRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Site Score'
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com'
                        }
                    },
                    required: ['name', 'url']
                },
                UpdateProjectRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'Updated Site Score'
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://updated-example.com'
                        }
                    }
                },
                CreateReportRequest: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            example: 'Homepage audit'
                        },
                        summary: {
                            type: 'string',
                            example: 'Initial report for homepage checks'
                        },
                        accessibilityScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 85
                        },
                        performanceScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 90
                        },
                        seoScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 78
                        },
                        uxScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 82
                        },
                        insights: {
                            nullable: true,
                            allOf: [
                                {
                                    $ref: '#/components/schemas/ReportInsights'
                                }
                            ]
                        }
                    },
                    required: [
                        'title',
                        'summary',
                        'accessibilityScore',
                        'performanceScore',
                        'seoScore',
                        'uxScore'
                    ]
                },
                UpdateReportRequest: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            example: 'Updated homepage audit'
                        },
                        summary: {
                            type: 'string',
                            example: 'Updated report summary'
                        },
                        accessibilityScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 88
                        },
                        performanceScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 95
                        },
                        seoScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 80
                        },
                        uxScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 84
                        },
                        insights: {
                            nullable: true,
                            allOf: [
                                {
                                    $ref: '#/components/schemas/ReportInsights'
                                }
                            ]
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
});

export { openApiSpec };
