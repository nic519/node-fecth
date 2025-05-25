const fs = require('fs');
const path = require('path');

// 模拟Cloudflare Worker环境
global.Request = class Request {
    constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = new Map(Object.entries(options.headers || {}));
    }
};

global.Response = class Response {
    constructor(body, options = {}) {
        this.body = body;
        this.status = options.status || 200;
        this.headers = new Map(Object.entries(options.headers || {}));
    }
    
    async text() {
        return this.body;
    }
    
    async json() {
        return JSON.parse(this.body);
    }
};

global.URL = URL;

// 模拟KV存储
const mockKV = new Map([
    ['test-key', 'test-value'],
    ['config', '{"setting": "value"}'],
    ['user-data', 'some user data']
]);

// 模拟环境变量
const mockEnv = {
    USER_CONFIGS: JSON.parse(fs.readFileSync('.dev.vars', 'utf8').match(/USER_CONFIGS='(.+)'/s)[1]),
    KV_BINDING: {
        get: async (key) => mockKV.get(key) || null,
        put: async (key, value) => mockKV.set(key, value),
        delete: async (key) => mockKV.delete(key)
    }
};

// 动态导入Worker代码
async function loadWorker() {
    // 这里需要编译TypeScript代码
    const { execSync } = require('child_process');
    
    try {
        // 编译TypeScript
        console.log('编译TypeScript代码...');
        execSync('npx tsc --outDir dist --target es2020 --module es2020 --moduleResolution node', { stdio: 'inherit' });
        
        // 导入编译后的代码
        const workerModule = await import('../dist/src/index.js');
        return workerModule.default;
    } catch (error) {
        console.error('编译失败:', error.message);
        return null;
    }
}

// 测试函数
async function runTests() {
    console.log('🚀 开始本地测试...\n');
    
    const worker = await loadWorker();
    if (!worker) {
        console.error('❌ Worker加载失败');
        return;
    }
    
    const tests = [
        {
            name: '测试存储路由',
            request: new Request('http://localhost:8787/storage?v=hello%20world'),
            expected: 'hello world'
        },
        {
            name: '测试KV路由 - 有效key',
            request: new Request('http://localhost:8787/kv?key=test-key&token=d2f1441a2f96&uid=519'),
            expected: 'test-value'
        },
        {
            name: '测试KV路由 - 无效token',
            request: new Request('http://localhost:8787/kv?key=test-key&token=invalid&uid=519'),
            expectedStatus: 401
        },
        {
            name: '测试KV路由 - 不存在的key',
            request: new Request('http://localhost:8787/kv?key=nonexistent&token=d2f1441a2f96&uid=519'),
            expectedStatus: 404
        },
        {
            name: '测试订阅路由 - 无效token',
            request: new Request('http://localhost:8787/519?token=invalid'),
            expectedStatus: 401
        },
        {
            name: '测试404路由',
            request: new Request('http://localhost:8787/nonexistent'),
            expectedStatus: 404
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`🧪 ${test.name}`);
            const response = await worker.fetch(test.request, mockEnv, {});
            
            if (test.expectedStatus) {
                if (response.status === test.expectedStatus) {
                    console.log(`✅ 状态码正确: ${response.status}`);
                } else {
                    console.log(`❌ 状态码错误: 期望 ${test.expectedStatus}, 实际 ${response.status}`);
                }
            }
            
            if (test.expected) {
                const body = await response.text();
                if (body === test.expected) {
                    console.log(`✅ 响应内容正确: ${body}`);
                } else {
                    console.log(`❌ 响应内容错误: 期望 "${test.expected}", 实际 "${body}"`);
                }
            }
            
            console.log('');
        } catch (error) {
            console.log(`❌ 测试失败: ${error.message}\n`);
        }
    }
}

// 运行测试
runTests().catch(console.error); 