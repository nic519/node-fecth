// 使用curl测试URL的脚本
const { execSync } = require('child_process');

console.log('🌐 使用curl测试URL\n');

function testWithCurl(url, description) {
    console.log(`🧪 ${description}`);
    console.log(`📡 URL: ${url}`);
    
    try {
        // 使用curl测试，显示状态码和响应头
        const result = execSync(`curl -s -w "\\n状态码: %{http_code}\\n" "${url}"`, { 
            encoding: 'utf8',
            timeout: 10000 
        });
        
        console.log('📄 响应:');
        console.log(result);
        
    } catch (error) {
        console.log('❌ curl测试失败:', error.message);
    }
    
    console.log('');
}

// 测试URL列表
const testUrls = [
    {
        url: 'http://127.0.0.1:8787/520?token=520',
        description: '测试520用户（你的问题URL）'
    },
    {
        url: 'http://127.0.0.1:8787/519?token=d2f1441a2f96',
        description: '测试519用户（已知正确的配置）'
    },
    {
        url: 'http://127.0.0.1:8787/storage?v=test',
        description: '测试存储路由'
    },
    {
        url: 'http://127.0.0.1:8787/nonexistent',
        description: '测试404路由'
    }
];

console.log('⚠️  注意：这个测试需要你先启动wrangler dev服务器');
console.log('请在另一个终端运行: npm run dev');
console.log('然后按任意键继续...\n');

// 等待用户确认
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    
    console.log('开始测试...\n');
    
    testUrls.forEach((test, index) => {
        if (index > 0) console.log('='.repeat(50) + '\n');
        testWithCurl(test.url, test.description);
    });
    
    console.log('🎯 如果520用户返回401，可能的原因：');
    console.log('1. wrangler dev没有正确加载.dev.vars文件');
    console.log('2. 环境变量解析有问题');
    console.log('3. 代码中有其他验证逻辑');
    console.log('\n💡 建议：检查wrangler dev的控制台输出是否有错误信息');
}); 