import { RouteHandler } from '@/types/routes.types';

export class DocsHandler implements RouteHandler {
  canHandle(request: Request): boolean {
    const url = new URL(request.url);
    // 只处理 /docs 路径，/openapi.json 由静态文件服务
    return url.pathname === '/docs';
  }

  async handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (pathname === '/docs') {
        return this.serveSwaggerUI();
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('文档处理错误:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
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
    .swagger-ui .info .title {
      color: #1f2937;
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
        // 使用静态生成的 openapi.json 文件
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
          console.log('✅ Swagger UI 已加载，使用自动生成的 API 文档');
        },
        onFailure: function(error) {
          console.error('❌ 加载 OpenAPI 规范失败:', error);
        },
        requestInterceptor: function(request) {
          console.log('🔗 API 请求:', request.url);
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