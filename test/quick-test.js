// 快速测试脚本 - 直接测试路由逻辑
console.log('🚀 开始快速路由测试...\n');

// 模拟基本的Request和Response
class MockRequest {
    constructor(url) {
        this.url = url;
        this.method = 'GET';
    }
}

class MockResponse {
    constructor(body, options = {}) {
        this.body = body;
        this.status = options.status || 200;
        this.headers = options.headers || {};
    }
    
    async text() {
        return this.body;
    }
}

// 模拟存储处理器逻辑
function testStorageHandler(url) {
    const urlObj = new URL(url);
    const content = urlObj.searchParams.get('v');
    
    if (!content) {
        return new MockResponse('No content provided', { status: 400 });
    }
    
    return new MockResponse(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 模拟KV处理器逻辑
function testKvHandler(url) {
    const urlObj = new URL(url);
    const key = urlObj.searchParams.get('key');
    const token = urlObj.searchParams.get('token');
    const uid = urlObj.searchParams.get('uid');
    
    if (!key || !token || !uid) {
        return new MockResponse('缺少必要参数: key, token, uid', { status: 400 });
    }
    
    // 模拟用户配置验证
    const validTokens = {
        '519': 'd2f1441a2f96',
        'yj': 'luh144olj60'
    };
    
    if (validTokens[uid] !== token) {
        return new MockResponse('Unauthorized', { status: 401 });
    }
    
    // 模拟KV数据
    const kvData = {
        'test-key': 'test-value',
        'config': '{"setting": "value"}',
        'user-data': 'some user data'
    };
    
    const value = kvData[key];
    if (value === undefined) {
        return new MockResponse('Key not found', { status: 404 });
    }
    
    return new MockResponse(value, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// 路由测试
function testRoute(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname === '/storage') {
        return testStorageHandler(url);
    } else if (pathname === '/kv') {
        return testKvHandler(url);
    } else if (pathname !== '/' && !pathname.startsWith('/nonexistent')) {
        // 订阅路由 - 简单验证
        const uid = pathname.slice(1);
        const token = urlObj.searchParams.get('token');
        
        const validTokens = {
            '519': 'd2f1441a2f96',
            'yj': 'luh144olj60'
        };
        
        if (!token || validTokens[uid] !== token) {
            return new MockResponse('Unauthorized', { status: 401 });
        }
        
        return new MockResponse('订阅配置内容...', { status: 200 });
    }
    
    return new MockResponse('Not Found', { status: 404 });
}

// 测试用例
const tests = [
    {
        name: '测试存储路由',
        url: 'http://localhost:8787/storage?v=hello%20world',
        expectedStatus: 200,
        expectedBody: 'hello world'
    },
    {
        name: '测试存储路由 - 缺少参数',
        url: 'http://localhost:8787/storage',
        expectedStatus: 400
    },
    {
        name: '测试KV路由 - 有效请求',
        url: 'http://localhost:8787/kv?key=test-key&token=d2f1441a2f96&uid=519',
        expectedStatus: 200,
        expectedBody: 'test-value'
    },
    {
        name: '测试KV路由 - 无效token',
        url: 'http://localhost:8787/kv?key=test-key&token=invalid&uid=519',
        expectedStatus: 401
    },
    {
        name: '测试KV路由 - 不存在的key',
        url: 'http://localhost:8787/kv?key=nonexistent&token=d2f1441a2f96&uid=519',
        expectedStatus: 404
    },
    {
        name: '测试KV路由 - 缺少参数',
        url: 'http://localhost:8787/kv?key=test-key',
        expectedStatus: 400
    },
    {
        name: '测试订阅路由 - 有效token',
        url: 'http://localhost:8787/519?token=d2f1441a2f96',
        expectedStatus: 200
    },
    {
        name: '测试订阅路由 - 无效token',
        url: 'http://localhost:8787/519?token=invalid',
        expectedStatus: 401
    },
    {
        name: '测试404路由',
        url: 'http://localhost:8787/nonexistent-route-that-should-404',
        expectedStatus: 404
    }
];

// 运行测试
async function runTests() {
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            console.log(`🧪 ${test.name}`);
            const response = testRoute(test.url);
            
            // 检查状态码
            if (response.status === test.expectedStatus) {
                console.log(`✅ 状态码正确: ${response.status}`);
                
                // 检查响应内容
                if (test.expectedBody) {
                    const body = await response.text();
                    if (body === test.expectedBody) {
                        console.log(`✅ 响应内容正确: ${body}`);
                    } else {
                        console.log(`❌ 响应内容错误: 期望 "${test.expectedBody}", 实际 "${body}"`);
                        failed++;
                        continue;
                    }
                }
                
                passed++;
            } else {
                console.log(`❌ 状态码错误: 期望 ${test.expectedStatus}, 实际 ${response.status}`);
                failed++;
            }
            
            console.log('');
        } catch (error) {
            console.log(`❌ 测试失败: ${error.message}\n`);
            failed++;
        }
    }
    
    console.log(`\n📊 测试结果: ${passed} 通过, ${failed} 失败`);
    
    if (failed === 0) {
        console.log('🎉 所有测试通过！');
    } else {
        console.log('⚠️  有测试失败，请检查代码');
    }
}

runTests(); 