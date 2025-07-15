const fs = require('fs');
const path = require('path');

interface RouteInfo {
  method: string;
  path: string;
  handler: string;
  description?: string;
  tags?: string[];
}

interface OpenAPIDoc {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
  };
}

class OpenAPIGenerator {
  private routes: RouteInfo[] = [];
  private schemas: Record<string, any> = {};

  constructor() {
    this.loadSchemas();
  }

  // 从 openapi-schemas.ts 加载 Zod schemas
  private loadSchemas() {
    // 简化版本，实际可以通过代码分析获取
    this.schemas = {
      UserConfig: {
        type: 'object',
        properties: {
          subscribe: { type: 'string', format: 'uri' },
          accessToken: { type: 'string' },
          ruleUrl: { type: 'string', format: 'uri' },
          fileName: { type: 'string' },
          multiPortMode: { type: 'array', items: { $ref: '#/components/schemas/AreaCode' } },
          appendSubList: { type: 'array', items: { $ref: '#/components/schemas/SubConfig' } },
          excludeRegex: { type: 'string' }
        },
        required: ['subscribe', 'accessToken']
      },
      UserSummary: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          token: { type: 'string' },
          hasConfig: { type: 'boolean' },
          source: { type: 'string', enum: ['kv', 'env', 'none'] },
          lastModified: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          subscribeUrl: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'disabled'] },
          trafficInfo: { $ref: '#/components/schemas/TrafficInfo' }
        }
      },
      TrafficInfo: {
        type: 'object',
        properties: {
          upload: { type: 'number' },
          download: { type: 'number' },
          total: { type: 'number' },
          used: { type: 'number' },
          remaining: { type: 'number' },
          expire: { type: 'number' },
          isExpired: { type: 'boolean' },
          usagePercent: { type: 'number' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'number' }
        },
        required: ['error']
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      }
    };
  }

  // 扫描路由处理器文件
  public scanRoutes() {
    const handlersDir = path.join(process.cwd(), 'src/routes/handler');
    const routerFile = path.join(process.cwd(), 'src/routes/routesHandler.ts');

    // 分析主路由文件
    this.analyzeRouterFile(routerFile);
    
    // 分析处理器文件
    if (fs.existsSync(handlersDir)) {
      const files = fs.readdirSync(handlersDir);
      files.forEach((file: string) => {
        if (file.endsWith('.ts')) {
          this.analyzeHandlerFile(path.join(handlersDir, file));
        }
      });
    }
  }

  private analyzeRouterFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 提取路由定义 (简化版正则，实际可用 AST 分析)
    const apiRouteMatches = content.match(/apiRoute\.(\w+)\(['"`]([^'"`]+)['"`]/g);
    if (apiRouteMatches) {
      apiRouteMatches.forEach((match: string) => {
        const matchResult = match.match(/(\w+)\(['"`]([^'"`]+)['"`]/);
        if (matchResult) {
          const [, method, path] = matchResult;
          if (method && path) {
            this.routes.push({
              method: method.toUpperCase(),
              path: `/api${path}`,
              handler: 'apiRoute',
              tags: ['api']
            });
          }
        }
      });
    }

    // 提取超级管理员路由
    const adminMatches = content.match(/\/api\/admin\/\*/g);
    if (adminMatches) {
      this.routes.push({
        method: 'ALL',
        path: '/api/admin/*',
        handler: 'SuperAdminHandler',
        tags: ['admin'],
        description: '超级管理员API接口'
      });
    }
  }

  private analyzeHandlerFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const filename = path.basename(filePath, '.ts');
    
    // 分析具体的API路径
    if (filename === 'userConfigHandler') {
      this.routes.push(
        {
          method: 'GET',
          path: '/api/config/users/{userId}',
          handler: 'UserConfigHandler.getUserConfig',
          description: '获取指定用户配置',
          tags: ['users', 'config']
        },
        {
          method: 'POST',
          path: '/api/config/users/{userId}',
          handler: 'UserConfigHandler.updateUserConfig',
          description: '更新用户配置',
          tags: ['users', 'config']
        },
        {
          method: 'DELETE',
          path: '/api/config/users/{userId}',
          handler: 'UserConfigHandler.deleteUserConfig',
          description: '删除用户配置',
          tags: ['users', 'config']
        },
        {
          method: 'GET',
          path: '/api/config/users',
          handler: 'UserConfigHandler.getAllUsers',
          description: '获取所有用户列表',
          tags: ['users', 'admin']
        }
      );
    }

    if (filename === 'superAdminHandler') {
      this.routes.push(
        {
          method: 'GET',
          path: '/api/admin/users',
          handler: 'SuperAdminHandler.getUsersList',
          description: '获取用户列表',
          tags: ['admin', 'users']
        },
        {
          method: 'POST',
          path: '/api/admin/users',
          handler: 'SuperAdminHandler.createUser',
          description: '创建新用户',
          tags: ['admin', 'users']
        },
        {
          method: 'DELETE',
          path: '/api/admin/users/{userId}',
          handler: 'SuperAdminHandler.deleteUser',
          description: '删除用户',
          tags: ['admin', 'users']
        },
        {
          method: 'POST',
          path: '/api/admin/users/{userId}/traffic/refresh',
          handler: 'SuperAdminHandler.refreshUserTraffic',
          description: '刷新用户流量信息',
          tags: ['admin', 'users', 'traffic']
        }
      );
    }
  }

  // 生成OpenAPI文档
  public generateOpenAPI(): OpenAPIDoc {
    const doc: OpenAPIDoc = {
      openapi: '3.0.0',
      info: {
        title: 'Node-Fetch API',
        version: '1.0.0',
        description: '订阅管理和用户配置 API 自动生成文档'
      },
      servers: [
        { url: '/api', description: 'API 服务器' },
        { url: 'http://localhost:8787/api', description: '开发服务器' }
      ],
      paths: {},
      components: {
        schemas: this.schemas
      }
    };

    // 转换路由为OpenAPI paths
    this.routes.forEach(route => {
      const path = route.path.replace(/{(\w+)}/g, '{$1}'); // 确保参数格式正确
      
      if (!doc.paths[path]) {
        doc.paths[path] = {};
      }

      const method = route.method.toLowerCase();
      doc.paths[path][method] = {
        summary: route.description || `${route.method} ${route.path}`,
        tags: route.tags || ['api'],
        parameters: this.generateParameters(route.path),
        responses: this.generateResponses(route)
      };

      // 如果是POST/PUT，添加请求体
      if (['post', 'put'].includes(method)) {
        doc.paths[path][method].requestBody = this.generateRequestBody(route);
      }
    });

    return doc;
  }

  private generateParameters(path: string) {
    const params = [];
    
    // 路径参数
    const pathParams = path.match(/{(\w+)}/g);
    if (pathParams) {
      pathParams.forEach(param => {
        const name = param.slice(1, -1); // 移除大括号
        params.push({
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `${name} 参数`
        });
      });
    }

    // 常见查询参数
    if (path.includes('/config/users/')) {
      params.push({
        name: 'token',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: '访问令牌'
      });
    }

    if (path.includes('/admin/')) {
      params.push({
        name: 'superToken',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: '超级管理员令牌'
      });
    }

    return params;
  }

  private generateResponses(route: RouteInfo) {
    const responses: any = {
      '401': {
        description: '未授权',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '500': {
        description: '服务器内部错误',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    };

    // 根据路由类型生成特定响应
    if (route.path.includes('/users') && route.method === 'GET') {
      responses['200'] = {
        description: '成功',
        content: {
          'application/json': {
            schema: route.path.endsWith('/users') 
              ? { type: 'array', items: { $ref: '#/components/schemas/UserSummary' } }
              : { $ref: '#/components/schemas/UserConfig' }
          }
        }
      };
    } else if (['POST', 'PUT', 'DELETE'].includes(route.method)) {
      responses['200'] = {
        description: '操作成功',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SuccessResponse' }
          }
        }
      };
    }

    return responses;
  }

  private generateRequestBody(route: RouteInfo) {
    if (route.path.includes('/users') && route.method === 'POST') {
      return {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserConfig' }
          }
        }
      };
    }
    return undefined;
  }

  // 保存生成的文档
  public saveToFile(outputPath: string) {
    this.scanRoutes();
    const doc = this.generateOpenAPI();
    fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));
    console.log(`✅ OpenAPI 文档已生成: ${outputPath}`);
  }
}

// 主函数
function main() {
  const generator = new OpenAPIGenerator();
  const outputPath = path.join(process.cwd(), 'public/openapi.json');
  
  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  generator.saveToFile(outputPath);
}

if (require.main === module) {
  main();
}

module.exports = { OpenAPIGenerator }; 