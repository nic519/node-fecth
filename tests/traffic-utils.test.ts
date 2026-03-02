import { test, expect } from "bun:test";
import { DynamicService } from '../src/modules/dynamic/dynamic.service';

/**
 * 简化版 TrafficUtils 测试
 * 不需要复杂的 mocking，专注于核心功能测试
 */

test("DynamicService - 正常获取测试", async () => {
	const url = 'https://moes.lnaspiring.com/M';

	try {
		const result = await DynamicService.getWithCache(url);

		console.log('✅ 测试通过');
		console.log(`📄 subInfo: ${result.traffic || '无'}`);
		console.log(`📏 内容长度: ${result.content.length} 字符`);

		expect(result).toBeDefined();
		expect(result.content).toBeDefined();
	} catch (error) {
		console.error('❌ 测试失败:', error);
		throw error;
	}
}, 30000); // 30s timeout for network request
