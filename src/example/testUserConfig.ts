import { UserManager } from '@/module/userManager/userManager';
import { UserConfig } from '@/types/user-config.schema';

// 模拟环境变量
const mockEnv = {
	DB_USER: JSON.stringify({
		user123: {
			subscribe: 'https://example.com/subscription',
			accessToken: 'test-token-123',
			ruleUrl: 'https://example.com/rules',
			fileName: 'config.yaml',
			multiPortMode: ['TW', 'SG', 'JP'],
			appendSubList: [
				{
					subscribe: 'https://example.com/sub1',
					flag: 'sub1',
					includeArea: ['US', 'HK'],
				},
			],
			excludeRegex: '.*test.*',
		},
	}),
	USERS_KV: {
		get: async (key: string) => {
			if (key === 'user:user456:config') {
				return JSON.stringify({
					subscribe: 'https://kv-example.com/subscription',
					accessToken: 'kv-token-456',
					ruleUrl: 'https://kv-example.com/rules',
				});
			}
			return null;
		},
		put: async (key: string, value: string) => {
			console.log(`KV PUT: ${key} = ${value}`);
			return;
		},
		delete: async (key: string) => {
			console.log(`KV DELETE: ${key}`);
			return;
		},
		list: async (options: any) => {
			return {
				keys: [{ name: 'user:user456:config' }, { name: 'user:user456:meta' }],
			};
		},
	} as any,
};

async function testUserConfig() {
	console.log('🧪 开始测试用户配置管理系统...\n');

	const userManager = new UserManager(mockEnv as any);

	// 测试1: 从环境变量获取配置
	console.log('📋 测试1: 从环境变量获取配置');
	const envConfig = await userManager.getUserConfig('user123');
	if (envConfig) {
		console.log('✅ 成功获取环境变量配置:');
		console.log(`   - 来源: ${envConfig.meta.source}`);
		console.log(`   - 订阅地址: ${envConfig.config.subscribe}`);
		console.log(`   - 多端口模式: ${envConfig.config.multiPortMode?.join(', ')}`);
	} else {
		console.log('❌ 获取环境变量配置失败');
	}

	// 测试2: 从KV获取配置
	console.log('\n📋 测试2: 从KV获取配置');
	const kvConfig = await userManager.getUserConfig('user456');
	if (kvConfig) {
		console.log('✅ 成功获取KV配置:');
		console.log(`   - 来源: ${kvConfig.meta.source}`);
		console.log(`   - 订阅地址: ${kvConfig.config.subscribe}`);
	} else {
		console.log('❌ 获取KV配置失败');
	}

	// 测试3: 获取不存在的用户配置
	console.log('\n📋 测试3: 获取不存在的用户配置');
	const nonExistentConfig = await userManager.getUserConfig('nonexistent');
	if (!nonExistentConfig) {
		console.log('✅ 正确处理不存在的用户配置');
	} else {
		console.log('❌ 应该返回null');
	}

	// 测试4: 保存配置到KV
	console.log('\n📋 测试4: 保存配置到KV');
	const newConfig: UserConfig = {
		subscribe: 'https://new-example.com/subscription',
		accessToken: 'new-token-789',
		ruleUrl: 'https://new-example.com/rules',
		fileName: 'new-config.yaml',
		multiPortMode: ['US', 'HK'],
		appendSubList: [
			{
				subscribe: 'https://new-example.com/sub1',
				flag: 'new-sub1',
				includeArea: ['JP', 'SG'],
			},
		],
		excludeRegex: '.*exclude.*',
	};

	const saveResult = await userManager.saveUserConfig('user789', newConfig);
	if (saveResult) {
		console.log('✅ 成功保存配置到KV');
	} else {
		console.log('❌ 保存配置失败');
	}

	// 测试5: 获取所有用户列表
	console.log('\n📋 测试5: 获取所有用户列表');
	const allUsers = await userManager.getAllUsers();
	console.log(`✅ 获取到 ${allUsers.length} 个用户:`);
	allUsers.forEach((userId) => console.log(`   - ${userId}`));

	// 测试6: 验证用户权限
	console.log('\n📋 测试6: 验证用户权限');
	const validToken = 'test-token-123';
	const invalidToken = 'invalid-token';

	const validPermission = userManager.validateUserPermission('user123', validToken);
	const invalidPermission = userManager.validateUserPermission('user123', invalidToken);

	console.log(`✅ 有效token权限验证: ${validPermission ? '通过' : '失败'}`);
	console.log(`✅ 无效token权限验证: ${invalidPermission ? '失败' : '通过'}`);

	// 测试7: 删除配置
	console.log('\n📋 测试7: 删除配置');
	const deleteResult = await userManager.deleteUserConfig('user789');
	if (deleteResult) {
		console.log('✅ 成功删除配置');
	} else {
		console.log('❌ 删除配置失败');
	}

	console.log('\n🎉 所有测试完成！');
}

// 运行测试
testUserConfig().catch(console.error);
