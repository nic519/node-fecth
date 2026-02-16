import { test, expect } from "bun:test";
import { ProxyFetch } from '../src/utils/request/proxy-fetch';

/**
 * 简化版 TrafficUtils 测试
 * 不需要复杂的 mocking，专注于核心功能测试
 */

test("TrafficUtils - 正常获取测试", async () => {
	const trafficUtils = new ProxyFetch('https://moes.lnaspiring.com/M');

	try {
		const result = await trafficUtils.fetchClashContent();

		console.log('✅ 测试通过');
		console.log(`📄 subInfo: ${result.subInfo || '无'}`);
		console.log(`📏 内容长度: ${result.content.length} 字符`);

		expect(result).toBeDefined();
		expect(result.content).toBeDefined();
	} catch (error) {
		console.error('❌ 测试失败:', error);
		throw error;
	}
}, 30000); // 30s timeout for network request
