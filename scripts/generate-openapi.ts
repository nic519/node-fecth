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
    securitySchemes?: Record<string, any>;
  };
}

class OpenAPIGenerator {
  private routes: RouteInfo[] = [];
  private schemas: Record<string, any> = {};

  constructor() {
    this.loadSchemas();
  }

  // 路径规范化工具函数
  private normalizeApiPath(path: string): string {
    // 移除开头的 /api 前缀，因为这已经在 servers 配置中定义了
    if (path.startsWith('/api/')) {
      return path.substring(4); // 移除 '/api'，保留 '/'
    }
    // 如果是根路径 /api，返回 /
    if (path === '/api') {
      return '/';
    }
    // 其他路径保持不变
    return path;
  }

  // 检查路径是否需要认证
  private requiresAuth(normalizedPath: string, tags: string[]): 'super' | 'user' | 'none' {
    if (tags.includes('管理员') || normalizedPath.startsWith('/admin/') || normalizedPath === '/config/allUsers') {
      return 'super';
    }
    if (normalizedPath.startsWith('/config/') || normalizedPath.startsWith('/storage/')) {
      return 'user';
    }
    return 'none';
  }

  // 从 openapi-schemas.ts 加载 Zod schemas
  private loadSchemas() {
    this.schemas = {
      UserConfig: {
        type: 'object',
        properties: {
          subscribe: { 
            type: 'string', 
            format: 'uri',
            description: '订阅URL地址'
          },
          accessToken: { 
            type: 'string',
            description: '用户访问令牌'
          },
          ruleUrl: { 
            type: 'string', 
            format: 'uri',
            description: '规则URL地址',
            nullable: true
          },
          fileName: { 
            type: 'string',
            description: '配置文件名称',
            nullable: true
          },
          multiPortMode: { 
            type: 'array', 
            items: { $ref: '#/components/schemas/AreaCode' },
            description: '多端口模式配置'
          },
          appendSubList: { 
            type: 'array', 
            items: { $ref: '#/components/schemas/SubConfig' },
            description: '附加订阅列表'
          },
          excludeRegex: { 
            type: 'string',
            description: '排除正则表达式',
            nullable: true
          }
        },
        required: ['subscribe', 'accessToken'],
        description: '用户配置对象'
      },
      AreaCode: {
        type: 'string',
        enum: ['HK', 'TW', 'SG', 'JP', 'KR', 'US', 'UK', 'DE', 'FR'],
        description: '地区代码'
      },
      SubConfig: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          name: { type: 'string' }
        },
        required: ['url', 'name'],
        description: '订阅配置'
      },
      UserSummary: {
        type: 'object',
        properties: {
          userId: { 
            type: 'string',
            description: '用户ID'
          },
          token: { 
            type: 'string',
            description: '用户令牌'
          },
          hasConfig: { 
            type: 'boolean',
            description: '是否有配置'
          },
          source: { 
            type: 'string', 
            enum: ['kv', 'env', 'none'],
            description: '配置来源'
          },
          lastModified: { 
            type: 'string', 
            nullable: true,
            description: '最后修改时间'
          },
          isActive: { 
            type: 'boolean',
            description: '是否激活'
          },
          subscribeUrl: { 
            type: 'string',
            description: '订阅URL'
          },
          status: { 
            type: 'string', 
            enum: ['active', 'inactive', 'disabled'],
            description: '用户状态'
          },
          trafficInfo: { 
            $ref: '#/components/schemas/TrafficInfo',
            description: '流量信息'
          }
        },
        required: ['userId', 'token', 'hasConfig'],
        description: '用户摘要信息'
      },
      TrafficInfo: {
        type: 'object',
        properties: {
          upload: { 
            type: 'number',
            description: '上传流量(字节)'
          },
          download: { 
            type: 'number',
            description: '下载流量(字节)'
          },
          total: { 
            type: 'number',
            description: '总流量(字节)'
          },
          used: { 
            type: 'number',
            description: '已用流量(字节)'
          },
          remaining: { 
            type: 'number',
            description: '剩余流量(字节)'
          },
          expire: { 
            type: 'number',
            description: '过期时间戳'
          },
          isExpired: { 
            type: 'boolean',
            description: '是否已过期'
          },
          usagePercent: { 
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: '使用百分比'
          }
        },
        description: '流量统计信息'
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { 
            type: 'boolean',
            description: '操作是否成功'
          },
          message: { 
            type: 'string',
            description: '响应消息'
          },
          data: {
            type: 'object',
            description: '响应数据',
            nullable: true
          }
        },
        required: ['success'],
        description: '成功响应'
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { 
            type: 'string',
            description: '错误类型'
          },
          message: { 
            type: 'string',
            description: '错误消息'
          },
          code: { 
            type: 'number',
            description: '错误代码'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: '错误发生时间'
          }
        },
        required: ['error', 'message'],
        description: '错误响应'
      },
      HealthStatus: {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['ok', 'error'],
            description: '服务状态'
          },
          timestamp: { 
            type: 'string',
            format: 'date-time',
            description: '检查时间'
          },
          version: { 
            type: 'string',
            description: '服务版本'
          }
        },
        required: ['status', 'timestamp'],
        description: '健康检查响应'
      },
      CreateUserRequest: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: '新用户的唯一标识符',
            example: 'user123'
          },
          config: {
            $ref: '#/components/schemas/UserConfig',
            description: '用户配置信息'
          },
          yaml: {
            type: 'string',
            description: 'YAML格式的用户配置（与config二选一）'
          }
        },
        required: ['userId'],
        description: '创建用户请求'
      },
      CreateUserResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: '创建结果消息',
            example: 'User created successfully'
          },
          userId: {
            type: 'string',
            description: '创建的用户ID'
          },
          config: {
            $ref: '#/components/schemas/UserConfig',
            description: '创建的用户配置'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: '创建时间'
          }
        },
        required: ['message', 'userId', 'timestamp'],
        description: '创建用户成功响应'
      }
    };
  }

  // 扫描路由处理器文件
  public scanRoutes() {
    console.log('🔍 开始扫描路由...');
    
    const handlersDir = path.join(process.cwd(), 'src/routes/handler');
    const routerFile = path.join(process.cwd(), 'src/routes/routesHandler.ts');

    // 分析主路由文件
    if (fs.existsSync(routerFile)) {
      console.log(`📄 分析路由文件: ${routerFile}`);
      this.analyzeRouterFile(routerFile);
    } else {
      console.warn(`⚠️  路由文件不存在: ${routerFile}`);
    }
    
    // 分析处理器文件
    if (fs.existsSync(handlersDir)) {
      const files = fs.readdirSync(handlersDir);
      console.log(`📁 发现 ${files.length} 个处理器文件`);
      
      files.forEach((file: string) => {
        if (file.endsWith('.ts')) {
          console.log(`📄 分析处理器: ${file}`);
          this.analyzeHandlerFile(path.join(handlersDir, file));
        }
      });
    } else {
      console.warn(`⚠️  处理器目录不存在: ${handlersDir}`);
    }

    // 分析KV模块中的处理器
    const kvHandlerPath = path.join(process.cwd(), 'src/module/kv/kvHandler.ts');
    if (fs.existsSync(kvHandlerPath)) {
      console.log(`📄 分析KV处理器: kvHandler.ts`);
      this.analyzeHandlerFile(kvHandlerPath);
    }

    // 添加基础路由
    this.addBaseRoutes();
    
    console.log(`✅ 扫描完成，发现 ${this.routes.length} 个路由`);
  }

  private addBaseRoutes() {
    // 健康检查路由
    this.routes.push({
      method: 'GET',
      path: '/health',
      handler: 'HealthCheck',
      description: '服务健康检查',
      tags: ['系统']
    });
  }

  private analyzeRouterFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 提取 apiRoute.xxx() 形式的路由定义
      const apiRouteMatches = content.match(/apiRoute\.(\w+)\(['"`]([^'"`]+)['"`]/g);
      if (apiRouteMatches) {
        apiRouteMatches.forEach((match: string) => {
          const matchResult = match.match(/(\w+)\(['"`]([^'"`]+)['"`]/);
          if (matchResult) {
            const [, method, path] = matchResult;
            if (method && path) {
              // 为实际的 API 路由添加更准确的标签和描述
              let description = '';
              let tags = ['api'];
              
              if (path === '/config/allUsers') {
                description = '获取所有用户列表';
                tags = ['管理员']; // 这个接口需要管理员权限
              } else if (path.startsWith('/config/users/')) {
                description = '用户配置管理';
                tags = ['用户配置'];
              } else if (path === '/create/user') {
                description = '创建新用户';
                tags = ['管理员']; // 创建用户需要管理员权限
              }
              
              this.routes.push({
                method: method.toUpperCase(),
                path: `/api${path}`,
                handler: 'apiRoute',
                description: description || `${method.toUpperCase()} 操作`,
                tags: tags
              });
            }
          }
        });
      }

      // 提取 this.app.xxx() 形式的API路由定义
      const appApiMatches = content.match(/this\.app\.(\w+)\(['"`](\/api\/[^'"`]+)['"`]/g);
      if (appApiMatches) {
        appApiMatches.forEach((match: string) => {
          const matchResult = match.match(/(\w+)\(['"`](\/api\/[^'"`]+)['"`]/);
          if (matchResult) {
            const [, method, fullPath] = matchResult;
            if (method && fullPath) {
              let description = '';
              let tags = ['api'];
              
              if (fullPath === '/api/create/user') {
                description = '创建新用户';
                tags = ['管理员'];
              } else if (fullPath.startsWith('/api/admin/')) {
                description = '超级管理员API接口';
                tags = ['管理员'];
              } else if (fullPath.startsWith('/api/config/users')) {
                description = '用户配置管理';
                tags = ['用户配置'];
              } else if (fullPath.startsWith('/api/config/')) {
                description = '配置管理';
                tags = ['配置'];
              } else if (fullPath.startsWith('/api/storage')) {
                description = '存储API';
                tags = ['存储'];
              } else if (fullPath.startsWith('/api/kv')) {
                description = 'KV存储API';
                tags = ['存储'];
              }
              
              this.routes.push({
                method: method.toUpperCase(),
                path: fullPath,
                handler: 'MainApp',
                description: description || `${method.toUpperCase()} 操作`,
                tags: tags
              });
            }
          }
        });
      }

      // 提取超级管理员路由
      const adminMatches = content.match(/\/api\/admin\/\*/g);
      if (adminMatches && !appApiMatches?.some((m: string) => m.includes('/api/admin/'))) {
        this.routes.push({
          method: 'ALL',
          path: '/api/admin/*',
          handler: 'SuperAdminHandler',
          tags: ['管理员'],
          description: '超级管理员API接口'
        });
      }
    } catch (error) {
      console.error(`❌ 分析路由文件出错 ${filePath}:`, error);
    }
  }

  private analyzeHandlerFile(filePath: string) {
    try {
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
            tags: ['用户配置']
          },
          {
            method: 'POST',
            path: '/api/config/users/{userId}',
            handler: 'UserConfigHandler.updateUserConfig',
            description: '创建或更新用户配置',
            tags: ['用户配置']
          },
          {
            method: 'PUT',
            path: '/api/config/users/{userId}',
            handler: 'UserConfigHandler.updateUserConfig',
            description: '更新用户配置',
            tags: ['用户配置']
          },
          {
            method: 'DELETE',
            path: '/api/config/users/{userId}',
            handler: 'UserConfigHandler.deleteUserConfig',
            description: '删除用户配置',
            tags: ['用户配置']
          }
          // 移除重复的 /api/config/users GET 接口，因为它与 /api/admin/users 功能重复
          // 获取所有用户列表应该只属于管理员功能，使用 /api/admin/users
        );
      }

      if (filename === 'superAdminHandler') {
        this.routes.push(
          {
            method: 'GET',
            path: '/api/admin/users',
            handler: 'SuperAdminHandler.getUsersList',
            description: '获取用户列表',
            tags: ['管理员']
          },
          {
            method: 'POST',
            path: '/api/admin/users',
            handler: 'SuperAdminHandler.createUser',
            description: '创建新用户',
            tags: ['管理员']
          },
          {
            method: 'DELETE',
            path: '/api/admin/users/{userId}',
            handler: 'SuperAdminHandler.deleteUser',
            description: '删除指定用户',
            tags: ['管理员']
          },
          {
            method: 'POST',
            path: '/api/admin/users/{userId}/traffic/refresh',
            handler: 'SuperAdminHandler.refreshUserTraffic',
            description: '刷新用户流量信息',
            tags: ['管理员']
          }
        );
      }

      if (filename === 'clashHandler') {
        this.routes.push(
          {
            method: 'GET',
            path: '/api/clash/{userId}',
            handler: 'ClashHandler.getClashConfig',
            description: '获取用户的Clash配置',
            tags: ['订阅', 'Clash']
          }
        );
      }

      if (filename === 'storageHandler') {
        this.routes.push(
          {
            method: 'GET',
            path: '/api/storage',
            handler: 'StorageHandler.getContent',
            description: '获取存储的内容',
            tags: ['存储']
          }
        );
      }

      if (filename === 'kvHandler') {
        this.routes.push(
          {
            method: 'GET',
            path: '/api/kv',
            handler: 'KvHandler.getValue',
            description: '获取KV存储的值',
            tags: ['存储']
          },
          {
            method: 'POST',
            path: '/api/kv',
            handler: 'KvHandler.setValue',
            description: '设置KV存储的值',
            tags: ['存储']
          }
        );
      }
    } catch (error) {
      console.error(`❌ 分析处理器文件出错 ${filePath}:`, error);
    }
  }

  // 生成OpenAPI文档
  public generateOpenAPI(): OpenAPIDoc {
    console.log('📝 开始生成 OpenAPI 文档...');
    
    const doc: OpenAPIDoc = {
      openapi: '3.0.0',
      info: {
        title: 'Node-Fetch API',
        version: '1.0.0',
        description: `订阅管理和用户配置 API 自动生成文档

## 功能特性
- 🔐 用户配置管理
- 📊 流量统计
- 🔄 订阅转换
- 👥 用户管理（管理员功能）
- 🗄️ KV 存储服务

## 认证说明
大部分 API 需要通过 \`token\` 查询参数进行认证。管理员接口需要 \`superToken\` 参数。

## 生成时间
${new Date().toISOString()}`
      },
      servers: [
        { url: '/api', description: 'API 服务器' },
        { url: 'http://localhost:8787/api', description: '开发服务器' }
      ],
      paths: {},
      components: {
        schemas: this.schemas,
        securitySchemes: {
          TokenAuth: {
            type: 'apiKey',
            in: 'query',
            name: 'token',
            description: '用户访问令牌'
          },
          SuperTokenAuth: {
            type: 'apiKey',
            in: 'query',
            name: 'superToken',
            description: '超级管理员令牌'
          }
        }
      }
    };

    // 转换路由为OpenAPI paths
    this.routes.forEach(route => {
      // 规范化路径并格式化参数
      const normalizedPath = this.normalizeApiPath(route.path);
      const path = normalizedPath.replace(/{(\w+)}/g, '{$1}');
      
      if (!doc.paths[path]) {
        doc.paths[path] = {};
      }

      const method = route.method.toLowerCase();
      const authType = this.requiresAuth(normalizedPath, route.tags || []);
      
      const pathItem: any = {
        summary: route.description || `${route.method} ${normalizedPath}`,
        description: this.getDetailedDescription(route, normalizedPath),
        tags: route.tags || ['api'],
        parameters: this.generateParameters(path, route.tags || [], authType),
        responses: this.generateResponses(route, normalizedPath)
      };

      // 添加安全性要求
      if (authType === 'super') {
        pathItem.security = [{ SuperTokenAuth: [] }];
      } else if (authType === 'user') {
        pathItem.security = [{ TokenAuth: [] }];
      }

      // 如果是POST/PUT，添加请求体
      if (['post', 'put'].includes(method)) {
        pathItem.requestBody = this.generateRequestBody(route);
      }

      doc.paths[path][method] = pathItem;
    });

    console.log(`✅ OpenAPI 文档生成完成，包含 ${Object.keys(doc.paths).length} 个路径`);
    return doc;
  }

  private getDetailedDescription(route: RouteInfo, normalizedPath: string): string {
    const descriptions: Record<string, string> = {
      '/health': '检查服务运行状态，返回服务版本和时间戳信息',
      '/config/allUsers': '管理员接口：获取系统中所有用户的摘要信息，包括用户状态、流量信息等',
      '/config/users/{userId}': route.method === 'GET' 
        ? '根据用户ID获取完整的用户配置信息，包括订阅URL、规则配置等'
        : route.method === 'DELETE'
        ? '删除指定用户的所有配置信息，操作不可逆'
        : '创建或更新用户配置，支持部分更新',
      '/admin/users': route.method === 'GET'
        ? '管理员接口：获取详细的用户列表，包括流量统计和状态信息'
        : '管理员接口：批量创建用户账户',
      '/admin/users/{userId}': '管理员接口：删除指定用户及其所有相关数据',
      '/admin/users/{userId}/traffic/refresh': '管理员接口：强制刷新用户的流量统计信息',
      '/create/user': '管理员接口：创建新用户账户，需要提供用户ID和配置信息',
      '/clash/{userId}': '生成用户专用的Clash配置文件，支持多种订阅源合并',
      '/storage/{key}': route.method === 'GET'
        ? '从KV存储中获取指定键的值'
        : '将数据存储到KV存储中的指定键'
    };

    return descriptions[normalizedPath] || route.description || `${route.method} 操作`;
  }

  private generateParameters(path: string, tags: string[], authType: 'super' | 'user' | 'none') {
    const params = [];
    
    // 路径参数
    const pathParams = path.match(/{(\w+)}/g);
    if (pathParams) {
      pathParams.forEach(param => {
        const name = param.slice(1, -1); // 移除大括号
        const paramInfo: any = {
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: this.getParameterDescription(name)
        };

        if (name === 'userId') {
          paramInfo.example = 'user123';
          paramInfo.description = '用户唯一标识符';
        } else if (name === 'key') {
          paramInfo.example = 'config_key';
          paramInfo.description = '存储键名';
        }

        params.push(paramInfo);
      });
    }

    // 认证参数
    if (authType === 'super') {
      params.push({
        name: 'superToken',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: '超级管理员访问令牌',
        example: 'super_secret_token'
      });
    } else if (authType === 'user') {
      params.push({
        name: 'token',
        in: 'query',
        required: true,
        schema: { type: 'string' },
        description: '用户访问令牌',
        example: 'user_access_token'
      });
    }

    // 特殊查询参数
    if (path.includes('/clash/')) {
      params.push(
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: { 
            type: 'string',
            enum: ['clash', 'v2ray', 'ss'],
            default: 'clash'
          },
          description: '配置文件类型'
        },
        {
          name: 'udp',
          in: 'query',
          required: false,
          schema: { type: 'boolean', default: true },
          description: '是否启用UDP'
        }
      );
    }

    return params;
  }

  private getParameterDescription(paramName: string): string {
    const descriptions: Record<string, string> = {
      userId: '用户唯一标识符',
      key: '存储键名',
      token: '用户访问令牌',
      superToken: '超级管理员令牌'
    };
    return descriptions[paramName] || `${paramName} 参数`;
  }

  private generateResponses(route: RouteInfo, normalizedPath: string) {
    const responses: any = {
      '400': {
        description: '请求参数错误',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '401': {
        description: '未授权访问',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '403': {
        description: '权限不足',
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
    
    if (route.path === '/health') {
      responses['200'] = {
        description: '服务健康状态',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/HealthStatus' }
          }
        }
      };
    } else if (normalizedPath.includes('/users/{userId}') && route.method === 'GET') {
      responses['200'] = {
        description: '用户配置信息',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserConfig' }
          }
        }
      };
      responses['404'] = {
        description: '用户不存在',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      };
    } else if (normalizedPath.includes('/users') && route.method === 'GET') {
      responses['200'] = {
        description: '用户列表',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/UserSummary' }
            }
          }
        }
      };
    } else if (normalizedPath.includes('/clash/')) {
      responses['200'] = {
        description: 'Clash配置文件',
        content: {
          'text/yaml': {
            schema: { type: 'string' }
          },
          'application/json': {
            schema: { type: 'object' }
          }
        }
      };
    } else if (normalizedPath === '/create/user' && route.method === 'PUT') {
      responses['201'] = {
        description: '用户创建成功',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUserResponse' }
          }
        }
      };
      responses['409'] = {
        description: '用户已存在',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
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
    } else {
      responses['200'] = {
        description: '请求成功',
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      };
    }

    return responses;
  }

  private generateRequestBody(route: RouteInfo) {
    const normalizedPath = this.normalizeApiPath(route.path);
    
    if (normalizedPath === '/create/user' && route.method === 'PUT') {
      return {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateUserRequest' }
          }
        }
      };
    }
    
    if (normalizedPath.includes('/users') && ['POST', 'PUT'].includes(route.method)) {
      return {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserConfig' }
          }
        }
      };
    }

    if (normalizedPath.includes('/storage/') && route.method === 'PUT') {
      return {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                value: {
                  type: 'string',
                  description: '要存储的值'
                }
              },
              required: ['value']
            }
          }
        }
      };
    }

    return undefined;
  }

  // 保存生成的文档
  public saveToFile(outputPath: string) {
    try {
      this.scanRoutes();
      const doc = this.generateOpenAPI();
      
      fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2), 'utf-8');
      
      console.log(`✅ OpenAPI 文档已生成: ${outputPath}`);
      console.log(`📊 统计信息:`);
      console.log(`   - 路径数量: ${Object.keys(doc.paths).length}`);
      console.log(`   - Schema数量: ${Object.keys(doc.components.schemas).length}`);
      console.log(`   - 文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    } catch (error) {
      console.error('❌ 生成 OpenAPI 文档失败:', error);
      throw error;
    }
  }
}

// 主函数
function main() {
  console.log('🚀 开始生成 OpenAPI 文档...');
  
  const generator = new OpenAPIGenerator();
  const outputPath = path.join(process.cwd(), 'public/openapi.json');
  
  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    console.log(`📁 创建输出目录: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    generator.saveToFile(outputPath);
    console.log('🎉 OpenAPI 文档生成完成!');
  } catch (error) {
    console.error('💥 生成失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { OpenAPIGenerator }; 