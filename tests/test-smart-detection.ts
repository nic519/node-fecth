// 测试智能域名检测逻辑
import { GlobalConfig } from './src/config/global-config.ts';

// 模拟 YamlMergeFactory 的检测逻辑（简化版）
function shouldUseInternalTemplate(urlOrId: string, workerUrl: string): boolean {
	if (!urlOrId.startsWith('http')) {
		return false; // 非URL格式，不使用此逻辑
	}

	try {
		const url = new URL(urlOrId);
		const workerUrlObj = new URL(workerUrl);

		// 检测域名是否相同
		const isSameDomain = url.hostname === workerUrlObj.hostname;

		// 检测是否是模板API路径
		const isTemplatePath = url.pathname.includes('/api/subscription/template/');

		console.log(`🔍 域名检测: URL=${url.hostname}, Worker=${workerUrlObj.hostname}, 相同=${isSameDomain}, 模板路径=${isTemplatePath}`);

		return isSameDomain && isTemplatePath;
	} catch (error) {
		console.error(`❌ URL解析失败:`, error);
		return false;
	}
}

function extractTemplateIdFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;

		// 匹配 /api/subscription/template/{templateId} 格式
		const match = pathname.match(/\/api\/subscription\/template\/(.+)$/);
		if (match && match[1]) {
			return match[1];
		}

		// 如果没有匹配到，尝试从查询参数中获取
		const templateId = urlObj.searchParams.get('template');
		if (templateId) {
			return templateId;
		}

		throw new Error(`无法从URL中提取模板ID: ${url}`);
	} catch (error) {
		console.error(`❌ 提取模板ID失败:`, error);
		throw new Error(`无法从URL中提取模板ID: ${error instanceof Error ? error.message : String(error)}`);
	}
}

// 测试函数
async function testSmartDetection() {
	console.log('🧪 开始测试智能域名检测逻辑\n');

	const workerUrl = GlobalConfig.workerUrl;
	console.log(`🔧 Worker URL: ${workerUrl}\n`);

	// 测试用例
	const testCases = [
		{
			name: '同域名模板URL (应该使用内部KV)',
			url: 'https://node.1024.hair/api/subscription/template/1759313797591',
			expectedInternal: true
		},
		{
			name: '同域名其他API (应该使用外部fetch)',
			url: 'https://node.1024.hair/api/x?uid=519&token=d2f1441a2f96&download=false',
			expectedInternal: false
		},
		{
			name: '不同域名模板URL (应该使用外部fetch)',
			url: 'https://example.com/api/subscription/template/1759313797591',
			expectedInternal: false
		},
		{
			name: '直接模板ID (应该使用内部KV)',
			url: '1759313797591',
			expectedInternal: false // 这个情况走其他逻辑分支
		},
		{
			name: 'HTTP同域名 (应该使用内部KV)',
			url: 'http://node.1024.hair/api/subscription/template/12345',
			expectedInternal: true
		},
		{
			name: '不同子域名 (应该使用外部fetch)',
			url: 'https://api.node.1024.hair/api/subscription/template/12345',
			expectedInternal: false
		}
	];

	for (let i = 0; i < testCases.length; i++) {
		const testCase = testCases[i];
		console.log(`--- 测试 ${i + 1}/${testCases.length}: ${testCase.name} ---`);
		console.log(`📍 URL: ${testCase.url}`);

		try {
			const shouldInternal = shouldUseInternalTemplate(testCase.url, workerUrl);
			const result = shouldInternal ? '内部KV' : '外部fetch';

			console.log(`🎯 检测结果: ${result}`);
			console.log(`✅ 预期结果: ${testCase.expectedInternal ? '内部KV' : '外部fetch'}`);
			console.log(`📊 结果匹配: ${shouldInternal === testCase.expectedInternal ? '✅ 通过' : '❌ 失败'}`);

			if (shouldInternal && testCase.url.startsWith('http')) {
				const templateId = extractTemplateIdFromUrl(testCase.url);
				console.log(`🆔 提取的模板ID: ${templateId}`);
			}

		} catch (error) {
			console.error(`❌ 测试失败:`, error instanceof Error ? error.message : String(error));
		}

		console.log('---\n');
	}
}

// 运行测试
testSmartDetection().catch(console.error);