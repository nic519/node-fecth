import { Router } from '../src/routes/router';

// 模拟环境
const mockEnv: Env = {
    USER_CONFIGS: {
        "519": {
            "SUB_URL": "https://ul6zrv9.bigme.online/api/v1/client/subscribe?token=daaae2f1441a2f9668ee794d2f43acd3",
            "ACCESS_TOKEN": "d2f1441a2f96",
            "FILE_NAME": "BigME-M"
        }
    },
    CF_WORKER_URL: "http://localhost:8787",
    KV_BINDING: {
        get: async (key: string) => {
            const mockData: Record<string, string> = {
                'test-key': 'test-value',
                'config': '{"setting": "value"}',
                'user-data': 'some user data'
            };
            return mockData[key] || null;
        },
        put: async () => {},
        delete: async () => {},
        list: async () => ({ keys: [] }),
        getWithMetadata: async () => ({ value: null, metadata: null })
    } as any
};

// 测试函数
async function testRoutes() {
    console.log('🚀 开始路由测试...\n');
    
    const router = new Router();
    
    const tests = [
        {
            name: '测试存储路由',
            url: 'http://localhost:8787/storage?v=hello%20world',
            expectedStatus: 200
        },
        {
            name: '测试KV路由 - 有效key',
            url: 'http://localhost:8787/kv?key=test-key&token=d2f1441a2f96&uid=519',
            expectedStatus: 200
        },
        {
            name: '测试KV路由 - 无效token',
            url: 'http://localhost:8787/kv?key=test-key&token=invalid&uid=519',
            expectedStatus: 401
        },
        {
            name: '测试KV路由 - 缺少参数',
            url: 'http://localhost:8787/kv?key=test-key',
            expectedStatus: 400
        },
        {
            name: '测试404路由',
            url: 'http://localhost:8787/nonexistent',
            expectedStatus: 404
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`🧪 ${test.name}`);
            const request = new Request(test.url);
            const response = await router.route(request, mockEnv);
            
            if (response.status === test.expectedStatus) {
                console.log(`✅ 状态码正确: ${response.status}`);
                
                if (response.status === 200) {
                    const body = await response.text();
                    console.log(`📄 响应内容: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
                }
            } else {
                console.log(`❌ 状态码错误: 期望 ${test.expectedStatus}, 实际 ${response.status}`);
            }
            
            console.log('');
        } catch (error) {
            console.log(`❌ 测试失败: ${error}\n`);
        }
    }
}

// 运行测试
testRoutes().catch(console.error); 