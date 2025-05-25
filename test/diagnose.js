// 综合诊断脚本
const fs = require('fs');

console.log('🔍 520用户访问问题诊断报告\n');

// 1. 检查配置文件
console.log('📋 1. 检查配置文件');
console.log('='.repeat(30));

try {
    const devVars = fs.readFileSync('.dev.vars', 'utf8');
    const match = devVars.match(/USER_CONFIGS='(.+)'/s);
    
    if (match) {
        const configs = JSON.parse(match[1]);
        console.log('✅ .dev.vars文件读取成功');
        console.log('👥 可用用户:', Object.keys(configs));
        
        if (configs['520']) {
            console.log('✅ 用户520存在');
            console.log('📄 520用户配置:', configs['520']);
            
            if (configs['520'].ACCESS_TOKEN === '520') {
                console.log('✅ ACCESS_TOKEN正确: "520"');
            } else {
                console.log('❌ ACCESS_TOKEN错误:', configs['520'].ACCESS_TOKEN);
            }
        } else {
            console.log('❌ 用户520不存在');
        }
    } else {
        console.log('❌ 无法解析USER_CONFIGS');
    }
} catch (error) {
    console.log('❌ 读取.dev.vars失败:', error.message);
}

console.log('\n📡 2. 网络连接测试');
console.log('='.repeat(30));

// 2. 测试网络连接
const { execSync } = require('child_process');

try {
    // 测试本地端口是否开放
    const result = execSync('netstat -an | findstr :8787', { encoding: 'utf8', timeout: 5000 });
    if (result.includes('8787')) {
        console.log('✅ 端口8787有进程监听');
        console.log('📄 详情:', result.trim());
    } else {
        console.log('❌ 端口8787没有进程监听');
    }
} catch (error) {
    console.log('⚠️  无法检查端口状态（可能是wrangler dev未启动）');
}

console.log('\n🧪 3. 逻辑验证测试');
console.log('='.repeat(30));

// 3. 逻辑验证
function validateLogic() {
    const url = 'http://127.0.0.1:8787/520?token=520';
    const urlObj = new URL(url);
    const uid = urlObj.pathname.slice(1);
    const token = urlObj.searchParams.get('token');
    
    console.log('📍 URL解析:');
    console.log(`   原始URL: ${url}`);
    console.log(`   路径: ${urlObj.pathname}`);
    console.log(`   用户ID: ${uid}`);
    console.log(`   Token: ${token}`);
    
    // 模拟验证逻辑
    if (!uid || !token) {
        console.log('❌ 缺少uid或token');
        return false;
    }
    
    if (uid === '520' && token === '520') {
        console.log('✅ 逻辑验证通过');
        return true;
    } else {
        console.log('❌ 逻辑验证失败');
        return false;
    }
}

const logicResult = validateLogic();

console.log('\n🎯 4. 可能的问题和解决方案');
console.log('='.repeat(30));

if (logicResult) {
    console.log('✅ 配置和逻辑都正确，问题可能在于：');
    console.log('');
    console.log('🔧 可能的原因：');
    console.log('1. wrangler dev没有正确加载.dev.vars文件');
    console.log('2. 代码中的ClashYamlMerge模块有问题');
    console.log('3. 环境变量在运行时解析失败');
    console.log('4. 缓存问题');
    console.log('');
    console.log('💡 解决方案：');
    console.log('1. 重启wrangler dev: npm run dev');
    console.log('2. 清除缓存: rm -rf .wrangler');
    console.log('3. 检查wrangler dev的控制台输出');
    console.log('4. 在代码中添加console.log调试');
    console.log('');
    console.log('🧪 测试步骤：');
    console.log('1. 启动服务: npm run dev');
    console.log('2. 在另一个终端运行: npm run test:curl');
    console.log('3. 或者直接访问: http://127.0.0.1:8787/520?token=520');
} else {
    console.log('❌ 配置有问题，请检查上面的错误信息');
}

console.log('\n📞 5. 快速测试命令');
console.log('='.repeat(30));
console.log('npm run test:520    # 运行520用户专用测试');
console.log('npm run test:url    # 验证URL格式');
console.log('npm run test:curl   # 使用curl测试（需要先启动dev服务器）');
console.log('npm run test        # 运行快速逻辑测试');

console.log('\n🎉 诊断完成！'); 