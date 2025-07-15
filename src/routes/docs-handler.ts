import { RouteHandler } from '@/types/routes.types';

// 将 OpenAPI 规范作为静态内容
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Node-Fetch API',
    version: '1.0.0',
    description: '订阅管理和用户配置 API 文档'
  },
  servers: [
    {
      url: '/api',
      description: 'API 服务器'
    }
  ],
  paths: {
    '/health': {
      get: {
        summary: '健康检查',
        description: '检查服务状态',
        tags: ['监控'],
        responses: {
          '200': {
            description: '服务正常',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/config/users/{userId}': {
      get: {
        summary: '获取用户配置',
        description: '根据用户ID获取用户配置信息',
        tags: ['用户配置'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '用户ID'
          }
        ],
        responses: {
          '200': {
            description: '用户配置信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                    config: { type: 'object' },
                    lastUpdated: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '404': {
            description: '用户不存在',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      put: {
        summary: '更新用户配置',
        description: '更新指定用户的配置信息',
        tags: ['用户配置'],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '用户ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  config: { type: 'object' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '配置更新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

export class DocsHandler implements RouteHandler {
  canHandle(request: Request): boolean {
    const url = new URL(request.url);
    return url.pathname === '/docs' || url.pathname === '/openapi.json';
  }

  async handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (pathname === '/openapi.json') {
        return this.serveOpenAPISpec();
      } else if (pathname === '/docs') {
        return this.serveSwaggerUI();
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('文档处理错误:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private serveOpenAPISpec(): Response {
    return new Response(JSON.stringify(openApiSpec, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }

  private serveSwaggerUI(): Response {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Node-Fetch API 文档</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .swagger-ui .topbar {
      background-color: #1f2937;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        onComplete: function() {
          console.log('Swagger UI 加载完成');
        },
        requestInterceptor: function(request) {
          console.log('API 请求:', request);
          return request;
        }
      });
      
      window.ui = ui;
    };
  </script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
} 