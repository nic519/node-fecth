// KV路由专用测试脚本
const fs = require('fs');

console.log('🗄️ KV路由测试工具\n');

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

// 分析URL格式
function analyzeUrl(url) {
    console.log(`🔍 分析URL: ${url}\n`);
    
    try {
        const urlObj = new URL(url);
        console.log(`📍 路径: ${urlObj.pathname}`);
        console.log(`🔍 查询参数:`);
        
        const params = {};
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
            console.log(`   ${key}: ${value}`);
        });
        
        return { urlObj, params };
    } catch (error) {
        console.log(`❌ URL格式错误: ${error.message}`);
        return null;
    }
}

// 验证KV路由参数
function validateKvParams(params, userConfigs) {
    console.log('\n🔐 验证KV路由参数:');
    
    const { key, token, uid } = params;
    
    // 检查必需参数
    const missing = [];
    if (!key) missing.push('key');
    if (!token) missing.push('token');
    if (!uid) missing.push('uid');
    
    if (missing.length > 0) {
        console.log(`❌ 缺少必需参数: ${missing.join(', ')}`);
        console.log('\n📝 正确的KV路由格式:');
        console.log('   /kv?key=键名&token=访问令牌&uid=用户ID');
        console.log('\n📋 示例:');
        console.log('   /kv?key=sub&token=520&uid=520');
        console.log('   /kv?key=config&token=d2f1441a2f96&uid=519');
        return false;
    }
    
    console.log(`✅ 参数完整: key=${key}, token=${token}, uid=${uid}`);
    
    // 验证用户和token
    const userConfig = userConfigs[uid];
    if (!userConfig) {
        console.log(`❌ 用户 ${uid} 不存在`);
        console.log('👥 可用用户:', Object.keys(userConfigs));
        return false;
    }
    
    if (token !== userConfig.ACCESS_TOKEN) {
        console.log(`❌ Token错误:`);
        console.log(`   期望: "${userConfig.ACCESS_TOKEN}"`);
        console.log(`   实际: "${token}"`);
        return false;
    }
    
    console.log('✅ 用户验证通过');
    return true;
}

// 生成正确的URL示例
function generateCorrectUrls(userConfigs) {
    console.log('\n📝 正确的KV路由URL示例:');
    console.log('='.repeat(40));
    
    Object.entries(userConfigs).forEach(([uid, config]) => {
        const token = config.ACCESS_TOKEN;
        console.log(`\n👤 用户 ${uid}:`);
        console.log(`   获取'sub'键: http://127.0.0.1:8787/kv?key=sub&token=${token}&uid=${uid}`);
        console.log(`   获取'config'键: http://127.0.0.1:8787/kv?key=config&token=${token}&uid=${uid}`);
    });
}

// 主测试函数
function testKvRoute() {
    const userConfigs = loadUserConfigs();
    
    // 测试用户提供的URL
    const userUrl = 'http://127.0.0.1:8787/kv=sub';
    console.log('🧪 测试用户提供的URL:');
    const analysis = analyzeUrl(userUrl);
    
    if (analysis) {
        const isValid = validateKvParams(analysis.params, userConfigs);
        if (!isValid) {
            console.log('\n❌ URL格式不正确');
        }
    }
    
    // 生成正确的URL示例
    generateCorrectUrls(userConfigs);
    
    // 测试正确格式的URL
    console.log('\n🧪 测试正确格式的URL:');
    console.log('='.repeat(40));
    
    const testUrls = [
        'http://127.0.0.1:8787/kv?key=sub&token=520&uid=520',
        'http://127.0.0.1:8787/kv?key=config&token=d2f1441a2f96&uid=519',
        'http://127.0.0.1:8787/kv?key=test&token=wrong&uid=520', // 错误token测试
        'http://127.0.0.1:8787/kv?key=sub&uid=520', // 缺少token测试
    ];
    
    testUrls.forEach((url, index) => {
        console.log(`\n${index + 1}. 测试: ${url}`);
        const analysis = analyzeUrl(url);
        if (analysis) {
            validateKvParams(analysis.params, userConfigs);
        }
    });
    
    console.log('\n💡 总结:');
    console.log('='.repeat(20));
    console.log('1. KV路由需要3个参数: key, token, uid');
    console.log('2. 你的URL缺少了查询参数格式 (应该用?和&)');
    console.log('3. 本地调试时KV会返回模拟数据，不会真正访问Cloudflare KV');
    console.log('4. 401错误是因为参数格式不正确导致的验证失败');
}

// 运行测试
testKvRoute();

async function testKvPut() {
    try {
        const fetch = (await import('node-fetch')).default;
        console.log('🧪 测试KV PUT功能');
        
        const testData = {
            key: 'test-key',
            value: 'test-value',
            uid: '519',
            token: 'd2f1441a2f96'
        };
        
        console.log('📤 发送PUT请求:', testData);
        
        const response = await fetch('http://localhost:8787/kv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📥 响应状态:', response.status);
        const text = await response.text();
        console.log('📥 响应内容:', text);
        
        if (response.ok) {
            console.log('✅ 测试成功');
        } else {
            console.log('❌ 测试失败');
        }
        
    } catch (error) {
        console.error('❌ 测试出错:', error);
    }
}

async function testKvGet() {
    try {
        const fetch = (await import('node-fetch')).default;
        console.log('\n🧪 测试KV GET功能');
        
        const testParams = {
            key: 'test-key',
            uid: '519',
            token: 'd2f1441a2f96'
        };
        
        const url = new URL('http://localhost:8787/kv');
        url.searchParams.set('key', testParams.key);
        url.searchParams.set('uid', testParams.uid);
        url.searchParams.set('token', testParams.token);
        
        console.log('📤 发送GET请求:', url.toString());
        
        const response = await fetch(url.toString());
        
        console.log('📥 响应状态:', response.status);
        const text = await response.text();
        console.log('📥 响应内容:', text);
        
        if (response.ok) {
            console.log('✅ 测试成功');
            if (text === 'test-value') {
                console.log('✅ 数据验证成功：写入和读取的值匹配');
            } else {
                console.log('❌ 数据验证失败：读取的值与写入的不匹配');
                console.log('期望值: test-value');
                console.log('实际值:', text);
            }
        } else {
            console.log('❌ 测试失败');
        }
        
    } catch (error) {
        console.error('❌ 测试出错:', error);
    }
}

// 先运行PUT测试，然后运行GET测试
async function runTests() {
    await testKvPut();
    await testKvGet();
}

runTests(); 