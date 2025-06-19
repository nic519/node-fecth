import { UserManager } from '../module/userManager/userManager';
import { AuthUtils } from '../utils/authUtils';

// 模拟环境变量（使用你的实际数据）
const mockEnv = {
	DB_USER: `yj:
  accessToken: luh144olj60
  fileName: BM-YJ
  subscribe: https://bigmesub.azure-api.net/simida/api/v1/client/subscribe?token=4848bcb141f58288d5e0e53ed15c5da1

yj-hitun:
  accessToken: scsdf4olj60
  fileName: Hitun-M 
  subscribe: https://subapi.rss-node.com/sub?target=clash&interval=129600&filename=Hitun&url=https%3A%2F%2Frss-node.com%2Flink%2FzLFDwkjMGnrThakp%3Fmu%3D1

yj2:
  accessToken: scsdf4olj60
  fileName: BM&Hitun
  subscribe: https://bigmesub.azure-api.net/simida/api/v1/client/subscribe?token=4848bcb141f58288d5e0e53ed15c5da1
  multiPortMode: [SG, TW, VN]
  appendSubList:
    - 
      subscribe: https://subapi.rss-node.com/sub?target=clash&url=https%3A%2F%2Frss-node.com%2Flink%2FzLFDwkjMGnrThakp%3Fmu%3D1
      flag: hitun
      includeArea: [VN]

sw-big:
  accessToken: ap6dazg
  fileName: BigME&NZ 
  subscribe: https://microsoft-api.bigme.online/api/v1/client/subscribe?token=49b010c78f4215f1cb98caea8113fdbd
  excludeRegex: Standard
  appendSubList:
    - 
      subscribe: https://ninjasub.com/link/W4k4JkOfmr72Pn5Y?clash=1
      flag: 🥷
      includeArea: [HK]`,
	USERS_KV: {} as any,
};

function testAuth() {
	console.log('🧪 开始测试权限验证...\n');

	// 测试1: 使用正确的token验证用户yj
	console.log('📋 测试1: 验证用户yj的正确token');
	const validResult = AuthUtils.validateToken(mockEnv as any, 'yj', 'luh144olj60');
	if (validResult instanceof Response) {
		console.log('❌ 验证失败:', validResult.status, validResult.statusText);
	} else {
		console.log('✅ 验证成功:');
		console.log(`   - 用户ID: ${validResult.fileName}`);
		console.log(`   - 订阅地址: ${validResult.subscribe}`);
		console.log(`   - AccessToken: ${validResult.accessToken}`);
	}

	// 测试2: 使用错误的token验证用户yj
	console.log('\n📋 测试2: 验证用户yj的错误token');
	const invalidResult = AuthUtils.validateToken(mockEnv as any, 'yj', 'wrong-token');
	if (invalidResult instanceof Response) {
		console.log('✅ 正确拒绝无效token:', invalidResult.status, invalidResult.statusText);
	} else {
		console.log('❌ 应该拒绝无效token');
	}

	// 测试3: 验证不存在的用户
	console.log('\n📋 测试3: 验证不存在的用户');
	const nonExistentResult = AuthUtils.validateToken(mockEnv as any, 'nonexistent', 'any-token');
	if (nonExistentResult instanceof Response) {
		console.log('✅ 正确拒绝不存在的用户:', nonExistentResult.status, nonExistentResult.statusText);
	} else {
		console.log('❌ 应该拒绝不存在的用户');
	}

	// 测试4: 使用UserManager验证权限
	console.log('\n📋 测试4: 使用UserManager验证权限');
	const userManager = new UserManager(mockEnv as any);

	const validPermission = userManager.validateUserPermission('yj', 'luh144olj60');
	const invalidPermission = userManager.validateUserPermission('yj', 'wrong-token');

	console.log(`✅ 有效token权限验证: ${validPermission ? '通过' : '失败'}`);
	console.log(`✅ 无效token权限验证: ${invalidPermission ? '失败' : '通过'}`);

	// 测试5: 获取用户配置
	console.log('\n📋 测试5: 获取用户配置');
	userManager.getUserConfig('yj').then((config) => {
		if (config) {
			console.log('✅ 成功获取用户配置:');
			console.log(`   - 来源: ${config.meta.source}`);
			console.log(`   - 订阅地址: ${config.config.subscribe}`);
			console.log(`   - 文件名: ${config.config.fileName}`);
		} else {
			console.log('❌ 获取用户配置失败');
		}
	});

	console.log('\n🎉 权限验证测试完成！');
}

// 运行测试
testAuth();
