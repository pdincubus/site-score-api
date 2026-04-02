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
                        'createdAt'
                    ]
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
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
});

export { openApiSpec };