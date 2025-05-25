// 调试520用户的专用测试脚本
const fs = require('fs');

console.log('🔍 调试520用户访问问题\n');

// 模拟Response类
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

// 从.dev.vars读取用户配置
function loadUserConfigs() {
    try {
        const devVars = fs.readFileSync('.dev.vars', 'utf8');
        const match = devVars.match(/USER_CONFIGS='(.+)'/s);
        if (match) {
            return JSON.parse(match[1]);
        }
    } catch (error) {
        console.error('读取配置失败:', error.message);
    }
    return {};
}

// 模拟getUserConfig函数
function getUserConfig(env, userId) {
    try {
        const configs = env.USER_CONFIGS;
        const userConfig = configs[userId];
        if (!userConfig) return null;
        
        // 模拟默认配置合并
        const DEFAULT_CONFIG = {
            ENGINE: 'https://url.v1.mk/sub',
            RULE_URL: 'https://raw.githubusercontent.com/zzy333444/passwall_rule/main/miho-cfg.yaml'
        };
        
        return {
            ...DEFAULT_CONFIG,
            ...userConfig,
            FILE_NAME: userConfig.FILE_NAME || 'clash'
        };
    } catch (error) {
        console.error('Failed to process USER_CONFIGS:', error);
        return null;
    }
}

// 模拟token验证
function validateToken(uid, token, env) {
    console.log(`🔐 开始验证...`);
    console.log(`   用户ID: ${uid}`);
    console.log(`   Token: ${token}`);
    
    if (!uid || !token) {
        console.log('❌ 缺少uid或token');
        return new MockResponse('Unauthorized', { status: 401 });
    }
    
    const userConfig = getUserConfig(env, uid);
    console.log(`📄 获取到的用户配置:`, userConfig);
    
    if (!userConfig) {
        console.log('❌ 用户配置不存在');
        return new MockResponse('Unauthorized', { status: 401 });
    }
    
    if (token !== userConfig.ACCESS_TOKEN) {
        console.log(`❌ Token不匹配:`);
        console.log(`   期望: "${userConfig.ACCESS_TOKEN}"`);
        console.log(`   实际: "${token}"`);
        return new MockResponse('Unauthorized', { status: 401 });
    }
    
    console.log('✅ Token验证通过');
    return userConfig;
}

// 模拟路由处理
function simulateRouteHandling(url) {
    console.log(`🧪 模拟路由处理: ${url}\n`);
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const token = urlObj.searchParams.get('token');
    
    console.log(`📍 解析路径: ${pathname}`);
    
    // 检查是否是存储路由
    if (pathname === '/storage') {
        console.log('📦 这是存储路由');
        return;
    }
    
    // 检查是否是KV路由
    if (pathname === '/kv') {
        console.log('🗄️ 这是KV路由');
        return;
    }
    
    // 订阅路由处理
    console.log('📡 这是订阅路由');
    const uid = pathname.slice(1);
    
    // 模拟环境
    const mockEnv = {
        USER_CONFIGS: loadUserConfigs()
    };
    
    console.log(`👤 提取的用户ID: ${uid}`);
    console.log(`🔑 提取的Token: ${token}\n`);
    
    // 验证token
    const authResult = validateToken(uid, token, mockEnv);
    
    if (authResult instanceof MockResponse) {
        console.log(`\n❌ 验证失败，返回状态码: ${authResult.status}`);
        console.log(`📄 响应内容: ${authResult.body}`);
        return authResult;
    } else {
        console.log(`\n✅ 验证成功！`);
        console.log(`📋 用户配置详情:`);
        console.log(`   SUB_URL: ${authResult.SUB_URL}`);
        console.log(`   FILE_NAME: ${authResult.FILE_NAME}`);
        console.log(`   RULE_URL: ${authResult.RULE_URL || '使用默认'}`);
        
        // 模拟成功响应
        return new MockResponse('订阅配置内容...', { status: 200 });
    }
}

// 测试多个场景
function runTests() {
    const testCases = [
        'http://127.0.0.1:8787/520?token=520',
        'http://127.0.0.1:8787/520?token=wrong',
        'http://127.0.0.1:8787/519?token=d2f1441a2f96',
        'http://127.0.0.1:8787/nonexistent?token=520'
    ];
    
    testCases.forEach((url, index) => {
        if (index > 0) console.log('\n' + '='.repeat(60) + '\n');
        simulateRouteHandling(url);
    });
}

// 运行测试
runTests(); 