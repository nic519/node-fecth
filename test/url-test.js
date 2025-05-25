// URL测试工具 - 快速测试特定URL
const fs = require('fs');

console.log('🔍 URL测试工具\n');

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

// 验证token
function validateToken(uid, token, userConfigs) {
    console.log(`🔐 验证用户: ${uid}, token: ${token}`);
    
    if (!uid || !token) {
        console.log('❌ 缺少uid或token');
        return false;
    }
    
    const userConfig = userConfigs[uid];
    if (!userConfig) {
        console.log(`❌ 用户 ${uid} 不存在`);
        console.log('📋 可用用户:', Object.keys(userConfigs));
        return false;
    }
    
    console.log(`📄 用户配置:`, userConfig);
    
    if (token !== userConfig.ACCESS_TOKEN) {
        console.log(`❌ token错误: 期望 "${userConfig.ACCESS_TOKEN}", 实际 "${token}"`);
        return false;
    }
    
    console.log('✅ token验证通过');
    return true;
}

// 测试URL
function testUrl(url) {
    console.log(`🧪 测试URL: ${url}\n`);
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const token = urlObj.searchParams.get('token');
    
    // 解析用户ID
    const uid = pathname.slice(1); // 去掉开头的 /
    
    console.log(`📍 路径: ${pathname}`);
    console.log(`👤 用户ID: ${uid}`);
    console.log(`🔑 Token: ${token}\n`);
    
    // 加载用户配置
    const userConfigs = loadUserConfigs();
    
    // 验证token
    const isValid = validateToken(uid, token, userConfigs);
    
    if (isValid) {
        console.log('\n🎉 验证成功！这个URL应该可以正常访问');
        console.log('📝 建议的完整URL格式:');
        console.log(`   ${url}&target=clash`);
    } else {
        console.log('\n❌ 验证失败！这个URL会返回401 Unauthorized');
        
        // 提供修复建议
        if (userConfigs[uid]) {
            const correctToken = userConfigs[uid].ACCESS_TOKEN;
            const fixedUrl = `${urlObj.origin}${pathname}?token=${correctToken}`;
            console.log(`🔧 正确的URL应该是: ${fixedUrl}`);
        }
    }
}

// 主函数
function main() {
    // 从命令行参数获取URL，如果没有则使用默认URL
    const testUrls = process.argv.slice(2);
    
    if (testUrls.length === 0) {
        // 默认测试URL
        testUrls.push('http://127.0.0.1:8787/520?token=520');
    }
    
    testUrls.forEach((url, index) => {
        if (index > 0) console.log('\n' + '='.repeat(50) + '\n');
        testUrl(url);
    });
}

main(); 