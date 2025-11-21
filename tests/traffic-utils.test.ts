import { ProxyFetch } from '../src/utils/request/proxy-fetch';

/**
 * 简化版 TrafficUtils 测试类
 * 不需要复杂的 mocking，专注于核心功能测试
 */
export class TrafficUtilsSimpleTest {
	constructor() {}

	/**
	 * 测试正常场景下的 fetchClashContent
	 */
	async testNormalFetch(): Promise<void> {
		const trafficUtils = new ProxyFetch('https://moes.lnaspiring.com/M');

		try {
			const result = await trafficUtils.fetchClashContent();

			console.log('✅ 测试通过');
			console.log(`📄 subInfo: ${result.subInfo || '无'}`);
			console.log(`📏 内容长度: ${result.content.length} 字符`);
		} catch (error) {
			console.error('❌ 测试失败:', error);
			throw error;
		}
	}

	/**
	 * 运行所有测试
	 */
	async runAllTests(): Promise<void> {
		console.log('🚀 开始运行 TrafficUtils 简化测试套件\n');

		const tests = [{ name: '正常获取测试', fn: () => this.testNormalFetch() }];

		for (const test of tests) {
			try {
				console.log(`\n==================== ${test.name} ====================`);
				await test.fn();
				console.log(`✅ ${test.name} 完成`);
			} catch (error) {
				console.error(`❌ ${test.name} 失败:`, error);
			}
		}

		console.log('\n🎉 所有测试完成!');
	}
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
	const tester = new TrafficUtilsSimpleTest();
	tester.runAllTests().catch(console.error);
}

// 导出测试类供其他文件使用
export default TrafficUtilsSimpleTest;
