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
                name: 'Clients',
                description: 'Client management routes'
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
                        clientId: {
                            type: 'string',
                            nullable: true,
                            example: '8c65aa37-d061-441c-8a8d-5f00f6235fb0'
                        },
                        archivedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            example: null
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-04-01T13:15:06.935Z'
                        }
                    },
                    required: ['id', 'name', 'url', 'clientId', 'archivedAt', 'createdAt']
                },
                Client: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: '8c65aa37-d061-441c-8a8d-5f00f6235fb0'
                        },
                        name: {
                            type: 'string',
                            example: 'Crayons & Code'
                        },
                        archivedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            example: null
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-07-10T08:00:00.000Z'
                        }
                    },
                    required: ['id', 'name', 'archivedAt', 'createdAt']
                },
                ClientSummary: {
                    type: 'object',
                    properties: {
                        projectCount: {
                            type: 'integer',
                            minimum: 0,
                            example: 3
                        },
                        reportCount: {
                            type: 'integer',
                            minimum: 0,
                            example: 12
                        }
                    },
                    required: ['projectCount', 'reportCount']
                },
                ClientListItem: {
                    allOf: [
                        {
                            $ref: '#/components/schemas/Client'
                        },
                        {
                            type: 'object',
                            properties: {
                                summary: {
                                    $ref: '#/components/schemas/ClientSummary'
                                }
                            },
                            required: ['summary']
                        }
                    ]
                },
                ProjectSummaryScores: {
                    type: 'object',
                    properties: {
                        performanceScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 94
                        },
                        accessibilityScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 89
                        },
                        seoScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 97
                        },
                        bestPracticesScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 93
                        },
                        agenticBrowsingScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 84
                        }
                    },
                    required: [
                        'performanceScore',
                        'accessibilityScore',
                        'seoScore',
                        'bestPracticesScore',
                        'agenticBrowsingScore'
                    ]
                },
                ProjectSummary: {
                    type: 'object',
                    properties: {
                        reportCount: {
                            type: 'integer',
                            minimum: 0,
                            example: 12
                        },
                        reportGroupCount: {
                            type: 'integer',
                            minimum: 0,
                            example: 4
                        },
                        latestReportCreatedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            example: '2026-07-08T08:00:00.000Z'
                        },
                        latestReportTitle: {
                            type: 'string',
                            nullable: true,
                            example: 'Homepage mobile audit'
                        },
                        latestScores: {
                            nullable: true,
                            allOf: [
                                {
                                    $ref: '#/components/schemas/ProjectSummaryScores'
                                }
                            ]
                        }
                    },
                    required: [
                        'reportCount',
                        'reportGroupCount',
                        'latestReportCreatedAt',
                        'latestReportTitle',
                        'latestScores'
                    ]
                },
                ProjectListItem: {
                    allOf: [
                        {
                            $ref: '#/components/schemas/Project'
                        },
                        {
                            type: 'object',
                            properties: {
                                summary: {
                                    $ref: '#/components/schemas/ProjectSummary'
                                }
                            },
                            required: ['summary']
                        }
                    ]
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
                        groupId: {
                            type: 'string',
                            nullable: true,
                            example: 'e6bc5c14-e05e-4f18-8b27-d9f6da78124f'
                        },
                        group: {
                            nullable: true,
                            allOf: [
                                {
                                    $ref: '#/components/schemas/ReportGroupSummary'
                                }
                            ]
                        },
                        title: {
                            type: 'string',
                            example: 'Homepage audit'
                        },
                        summary: {
                            type: 'string',
                            example: 'Initial report for homepage checks'
                        },
                        pageUrl: {
                            type: 'string',
                            format: 'uri',
                            maxLength: 2048,
                            example: 'https://example.com/'
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
                        bestPracticesScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 92
                        },
                        agenticBrowsingScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 80
                        },
                        insights: {
                            nullable: true,
                            allOf: [
                                {
                                    $ref: '#/components/schemas/ReportInsights'
                                }
                            ]
                        },
                        comparison: {
                            nullable: true,
                            allOf: [
                                {
                                    $ref: '#/components/schemas/ReportComparison'
                                }
                            ]
                        },
                        archivedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            example: null
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
                        'groupId',
                        'group',
                        'title',
                        'summary',
                        'pageUrl',
                        'accessibilityScore',
                        'performanceScore',
                        'seoScore',
                        'bestPracticesScore',
                        'agenticBrowsingScore',
                        'insights',
                        'comparison',
                        'archivedAt',
                        'createdAt'
                    ]
                },
                ReportScoreComparison: {
                    type: 'object',
                    properties: {
                        performanceScore: {
                            type: 'integer',
                            example: 7
                        },
                        accessibilityScore: {
                            type: 'integer',
                            example: 0
                        },
                        seoScore: {
                            type: 'integer',
                            example: -2
                        },
                        bestPracticesScore: {
                            type: 'integer',
                            example: 4
                        },
                        agenticBrowsingScore: {
                            type: 'integer',
                            example: -3
                        }
                    },
                    required: [
                        'performanceScore',
                        'accessibilityScore',
                        'seoScore',
                        'bestPracticesScore',
                        'agenticBrowsingScore'
                    ]
                },
                ReportInsightUserTimingComparison: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'app:hydrate'
                        },
                        entryType: {
                            type: 'string',
                            enum: ['mark', 'measure'],
                            example: 'measure'
                        },
                        currentValue: {
                            type: 'number',
                            nullable: true,
                            example: 850
                        },
                        previousValue: {
                            type: 'number',
                            nullable: true,
                            example: 1270
                        },
                        delta: {
                            type: 'number',
                            nullable: true,
                            example: -420
                        },
                        unit: {
                            type: 'string',
                            enum: ['ms'],
                            example: 'ms'
                        },
                        previousReportId: {
                            type: 'string',
                            example: 'f4d90c3c-6577-4cd4-8fc4-5d63c2f8a4a8'
                        },
                        previousCreatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-06-08T09:30:00.000Z'
                        }
                    },
                    required: ['name', 'entryType', 'currentValue', 'previousValue', 'delta', 'unit']
                },
                ReportComparison: {
                    type: 'object',
                    properties: {
                        previousReportId: {
                            type: 'string',
                            example: 'f4d90c3c-6577-4cd4-8fc4-5d63c2f8a4a8'
                        },
                        previousCreatedAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-06-08T09:30:00.000Z'
                        },
                        scores: {
                            $ref: '#/components/schemas/ReportScoreComparison'
                        },
                        userTimings: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ReportInsightUserTimingComparison'
                            }
                        }
                    },
                    required: ['previousReportId', 'previousCreatedAt', 'scores']
                },
                ReportTrendPoint: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'f4d90c3c-6577-4cd4-8fc4-5d63c2f8a4a8'
                        },
                        title: {
                            type: 'string',
                            example: 'Homepage mobile - July snapshot'
                        },
                        pageUrl: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-07-08T09:30:00.000Z'
                        },
                        performanceScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 75
                        },
                        accessibilityScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 97
                        },
                        seoScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 98
                        },
                        bestPracticesScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 90
                        },
                        agenticBrowsingScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 79
                        }
                    },
                    required: [
                        'id',
                        'title',
                        'pageUrl',
                        'createdAt',
                        'performanceScore',
                        'accessibilityScore',
                        'seoScore',
                        'bestPracticesScore',
                        'agenticBrowsingScore'
                    ]
                },
                ReportGroupTrend: {
                    type: 'object',
                    properties: {
                        groupId: {
                            type: 'string',
                            example: 'e6bc5c14-e05e-4f18-8b27-d9f6da78124f'
                        },
                        groupName: {
                            type: 'string',
                            example: 'Homepage mobile'
                        },
                        pageUrl: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/'
                        },
                        strategy: {
                            type: 'string',
                            enum: ['mobile', 'desktop'],
                            example: 'mobile'
                        },
                        points: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/ReportTrendPoint'
                            }
                        }
                    },
                    required: ['groupId', 'groupName', 'pageUrl', 'strategy', 'points']
                },
                ReportGroup: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'e6bc5c14-e05e-4f18-8b27-d9f6da78124f'
                        },
                        projectId: {
                            type: 'string',
                            example: '0fd1f6d1-5a7b-4a8a-a7f8-75d1c59c3e1d'
                        },
                        name: {
                            type: 'string',
                            maxLength: 120,
                            example: 'Homepage mobile'
                        },
                        pageUrl: {
                            type: 'string',
                            format: 'uri',
                            maxLength: 2048,
                            example: 'https://example.com/'
                        },
                        strategy: {
                            type: 'string',
                            enum: ['mobile', 'desktop'],
                            example: 'mobile'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            example: '2026-07-08T08:00:00.000Z'
                        }
                    },
                    required: ['id', 'projectId', 'name', 'pageUrl', 'strategy', 'createdAt']
                },
                ReportGroupSummary: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'e6bc5c14-e05e-4f18-8b27-d9f6da78124f'
                        },
                        name: {
                            type: 'string',
                            example: 'Homepage mobile'
                        },
                        pageUrl: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://example.com/'
                        },
                        strategy: {
                            type: 'string',
                            enum: ['mobile', 'desktop'],
                            example: 'mobile'
                        }
                    },
                    required: ['id', 'name', 'pageUrl', 'strategy']
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
                            enum: ['ms', 'score', 'unitless', 'bytes'],
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
                        pageWeight: {
                            $ref: '#/components/schemas/ReportInsightMetric'
                        },
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
                ReportInsightAuditRef: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'tap-targets'
                        },
                        title: {
                            type: 'string',
                            example: 'Tap targets are not sized appropriately'
                        },
                        category: {
                            type: 'string',
                            example: 'seo'
                        },
                        severity: {
                            type: 'string',
                            enum: ['fail', 'warning'],
                            example: 'fail'
                        },
                        displayValue: {
                            type: 'string',
                            nullable: true,
                            example: null
                        },
                        score: {
                            type: 'number',
                            nullable: true,
                            example: 0
                        }
                    },
                    required: ['id', 'title', 'category', 'severity', 'displayValue', 'score']
                },
                ReportInsightUserTiming: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: 'app:hydrate'
                        },
                        entryType: {
                            type: 'string',
                            enum: ['mark', 'measure'],
                            example: 'measure'
                        },
                        startTime: {
                            type: 'number',
                            nullable: true,
                            example: 690
                        },
                        duration: {
                            type: 'number',
                            nullable: true,
                            example: 850
                        },
                        displayValue: {
                            type: 'string',
                            nullable: true,
                            example: '850 ms'
                        }
                    },
                    required: ['name', 'entryType', 'startTime', 'duration', 'displayValue']
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
                                },
                                agenticBrowsing: {
                                    type: 'integer',
                                    nullable: true,
                                    minimum: 0,
                                    maximum: 100,
                                    example: null
                                }
                            },
                            required: [
                                'performance',
                                'accessibility',
                                'bestPractices',
                                'seo',
                                'agenticBrowsing'
                            ]
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
                        },
                        auditRefs: {
                            type: 'array',
                            maxItems: 20,
                            items: {
                                $ref: '#/components/schemas/ReportInsightAuditRef'
                            }
                        },
                        userTimings: {
                            type: 'array',
                            maxItems: 50,
                            items: {
                                $ref: '#/components/schemas/ReportInsightUserTiming'
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
                        },
                        clientId: {
                            type: 'string',
                            nullable: true,
                            example: '8c65aa37-d061-441c-8a8d-5f00f6235fb0'
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
                        },
                        clientId: {
                            type: 'string',
                            nullable: true,
                            example: null
                        }
                    }
                },
                CreateClientRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            maxLength: 160,
                            example: 'Crayons & Code'
                        }
                    },
                    required: ['name']
                },
                UpdateClientRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            maxLength: 160,
                            example: 'Crayons and Code'
                        }
                    },
                    required: ['name']
                },
                CreateReportGroupRequest: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            maxLength: 120,
                            example: 'Homepage mobile'
                        },
                        pageUrl: {
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
                    required: ['name', 'pageUrl', 'strategy']
                },
                CreateReportRequest: {
                    type: 'object',
                    properties: {
                        groupId: {
                            type: 'string',
                            example: 'e6bc5c14-e05e-4f18-8b27-d9f6da78124f'
                        },
                        title: {
                            type: 'string',
                            maxLength: 160,
                            example: 'Homepage audit'
                        },
                        summary: {
                            type: 'string',
                            maxLength: 500,
                            example: 'Initial report for homepage checks'
                        },
                        pageUrl: {
                            type: 'string',
                            format: 'uri',
                            maxLength: 2048,
                            example: 'https://example.com/'
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
                        bestPracticesScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 92
                        },
                        agenticBrowsingScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 80
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
                        'groupId',
                        'title',
                        'summary',
                        'pageUrl',
                        'accessibilityScore',
                        'performanceScore',
                        'seoScore',
                        'bestPracticesScore',
                        'agenticBrowsingScore'
                    ]
                },
                UpdateReportRequest: {
                    type: 'object',
                    properties: {
                        groupId: {
                            type: 'string',
                            example: 'e6bc5c14-e05e-4f18-8b27-d9f6da78124f'
                        },
                        title: {
                            type: 'string',
                            maxLength: 160,
                            example: 'Updated homepage audit'
                        },
                        summary: {
                            type: 'string',
                            maxLength: 500,
                            example: 'Updated report summary'
                        },
                        pageUrl: {
                            type: 'string',
                            format: 'uri',
                            maxLength: 2048,
                            example: 'https://example.com/'
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
                        bestPracticesScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 88
                        },
                        agenticBrowsingScore: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            example: 82
                        }
                    },
                    required: [
                        'groupId',
                        'title',
                        'summary',
                        'pageUrl',
                        'accessibilityScore',
                        'performanceScore',
                        'seoScore',
                        'bestPracticesScore',
                        'agenticBrowsingScore'
                    ]
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
});

export { openApiSpec };
