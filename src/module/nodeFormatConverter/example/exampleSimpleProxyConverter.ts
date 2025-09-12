/**
 * 简化版代理转换器使用示例
 * 专注于核心功能：将SSR订阅转换为Clash代理配置
 */

import { convertBase64ToClash, convertLinksToClash, parseProxyLink } from '@/module/nodeFormatConverter';

/**
 * 基础转换示例
 */
async function basicConversionExample() {
	console.log('\n🚀 基础转换示例');
	console.log('='.repeat(50));

	// 示例SSR链接（base64编码的订阅）
	const ssrLinks = [
		'ssr://cHIzLmp5bXpmZmJxdWF3bC5jb206MzAyNTphdXRoX2FlczEyOF9zaGExOmNoYWNoYTIwLWlldGY6cGxhaW46Y21WdWVtaGxZMnh2ZFdRLz9vYmZzcGFyYW09WldWbU5UWXpNREk0TmpBdWJXbGpjbTl6YjJaMExtTnZiUSZwcm90b3BhcmFtPU16QXlPRFl3T2pjemJWWTJZdyZyZW1hcmtzPVVISmxiV2wxYlh6bGo3RG11YjU4U1VWUVRId3dNUSZncm91cD1VbVZ1ZW1obFEyeHZkV1E',
		'ssr://cHIzLmp5bXpmZmJxdWF3bC5jb206MzAzNTphdXRoX2FlczEyOF9zaGExOmNoYWNoYTIwLWlldGY6cGxhaW46Y21WdWVtaGxZMnh2ZFdRLz9vYmZzcGFyYW09WldWbU5UWXpNREk0TmpBdWJXbGpjbTl6YjJaMExtTnZiUSZwcm90b3BhcmFtPU16QXlPRFl3T2pjemJWWTJZdyZyZW1hcmtzPVVISmxiV2wxYlh6bGo3RG11YjU4U1VWUVRId3dNZyZncm91cD1VbVZ1ZW1obFEyeHZkV1E',
	];

	try {
		// 1. 转换SSR链接列表为Clash配置
		console.log('📝 转换SSR链接列表...');
		const result = await convertLinksToClash(ssrLinks);

		if (result.success) {
			console.log('✅ 转换成功！');
			console.log(`📊 生成了 ${result.stats?.validNodes} 个有效节点`);

			// 显示生成的YAML配置（前几行）
			if (result.data) {
				const lines = result.data.split('\n');
				console.log('\n📄 生成的Clash配置:');
				lines.slice(0, 15).forEach((line, index) => {
					console.log(`${(index + 1).toString().padStart(2)}: ${line}`);
				});
				console.log('... (更多配置)');
			}
		} else {
			console.error('❌ 转换失败:', result.error);
		}

		// 2. 解析单个SSR链接
		console.log('\n🔗 解析单个SSR链接...');
		const parseResult = await parseProxyLink(ssrLinks[0]);

		if (parseResult.success && parseResult.data) {
			const node = parseResult.data;
			console.log('✅ 解析成功！');
			console.log(`   节点名称: ${node.name}`);
			console.log(`   服务器: ${node.server}:${node.port}`);
			console.log(`   协议: ${node.type}`);
		}
	} catch (error) {
		console.error('💥 异常:', error);
	}
}

/**
 * Base64订阅转换示例
 */
async function base64SubscriptionExample() {
	console.log('\n📦 Base64订阅转换示例');
	console.log('='.repeat(50));

	// 将SSR链接编码为base64（模拟订阅内容）
	const ssrLinks = [
		'ssr://cHIzLmp5bXpmZmJxdWF3bC5jb206MzAyNTphdXRoX2FlczEyOF9zaGExOmNoYWNoYTIwLWlldGY6cGxhaW46Y21WdWVtaGxZMnh2ZFdRLz9vYmZzcGFyYW09WldWbU5UWXpNREk0TmpBdWJXbGpjbTl6YjJaMExtTnZiUSZwcm90b3BhcmFtPU16QXlPRFl3T2pjemJWWTJZdyZyZW1hcmtzPVVISmxiV2wxYlh6bGo3RG11YjU4U1VWUVRId3dNUSZncm91cD1VbVZ1ZW1obFEyeHZkV1E',
		'ssr://cHIzLmp5bXpmZmJxdWF3bC5jb206MzAzNTphdXRoX2FlczEyOF9zaGExOmNoYWNoYTIwLWlldGY6cGxhaW46Y21WdWVtaGxZMnh2ZFdRLz9vYmZzcGFyYW09WldWbU5UWXpNREk0TmpBdWJXbGpjbTl6YjJaMExtTnZiUSZwcm90b3BhcmFtPU16QXlPRFl3T2pjemJWWTJZdyZyZW1hcmtzPVVISmxiV2wxYlh6bGo3RG11YjU4U1VWUVRId3dNZyZncm91cD1VbVZ1ZW1obFEyeHZkV1E',
		'ssr://cHIzLmp5bXpmZmJxdWF3bC5jb206MzA0NTphdXRoX2FlczEyOF9zaGExOmNoYWNoYTIwLWlldGY6cGxhaW46Y21WdWVtaGxZMnh2ZFdRLz9vYmZzcGFyYW09WldWbU5UWXpNREk0TmpBdWJXbGpjbTl6YjJaMExtTnZiUSZwcm90b3BhcmFtPU16QXlPRFl3T2pjemJWWTJZdyZyZW1hcmtzPVVISmxiV2wxYlh6bGo3RG11YjU4U1VWUVRId3dNdyZncm91cD1VbVZ1ZW1obFEyeHZkV1E',
	];

	const base64Content = btoa(ssrLinks.join('\n'));

	try {
		console.log('📝 转换base64订阅内容...');
		const result = await convertBase64ToClash(base64Content, {
			includeDirectProxy: true,
			enableUDP: true,
			outputFormat: 'yaml',
		});

		if (result.success) {
			console.log('✅ 转换成功！');
			console.log(`📊 统计信息:`);
			console.log(`   总节点数: ${result.stats?.totalNodes}`);
			console.log(`   有效节点: ${result.stats?.validNodes}`);

			if (result.stats?.regions) {
				console.log('   地区分布:');
				Object.entries(result.stats.regions).forEach(([region, count]) => {
					console.log(`     ${region}: ${count} 个`);
				});
			}

			if (result.warnings && result.warnings.length > 0) {
				console.log('⚠️ 警告信息:');
				result.warnings.forEach((warning) => console.log(`   - ${warning}`));
			}
		} else {
			console.error('❌ 转换失败:', result.error);
		}
	} catch (error) {
		console.error('💥 异常:', error);
	}
}

/**
 * 过滤选项示例
 */
async function filterOptionsExample() {
	console.log('\n🔍 过滤选项示例');
	console.log('='.repeat(50));

	const ssrLinks = [
		'ssr://cHIzLmp5bXpmZmJxdWF3bC5jb206MzAyNTphdXRoX2FlczEyOF9zaGExOmNoYWNoYTIwLWlldGY6cGxhaW46Y21WdWVtaGxZMnh2ZFdRLz9vYmZzcGFyYW09WldWbU5UWXpNREk0TmpBdWJXbGpjbTl6YjJaMExtTnZiUSZwcm90b3BhcmFtPU16QXlPRFl3T2pjemJWWTJZdyZyZW1hcmtzPVVISmxiV2wxYlh6bGo3RG11YjU4U1VWUVRId3dNUSZncm91cD1VbVZ1ZW1obFEyeHZkV1E',
		'ssr://cHIzLmp5bXpmZmJxdWF3bC5jb206MzAzNTphdXRoX2FlczEyOF9zaGExOmNoYWNoYTIwLWlldGY6cGxhaW46Y21WdWVtaGxZMnh2ZFdRLz9vYmZzcGFyYW09WldWbU5UWXpNREk0TmpBdWJXbGpjbTl6YjJaMExtTnZiUSZwcm90b3BhcmFtPU16QXlPRFl3T2pjemJWWTJZdyZyZW1hcmtzPVVISmxiV2wxYlh6bGo3RG11YjU4U1VWUVRId3dNZyZncm91cD1VbVZ1ZW1obFEyeHZkV1E',
	];

	try {
		// 使用过滤选项
		const result = await convertLinksToClash(ssrLinks, {
			includeDirectProxy: false, // 不包含直连代理
			enableUDP: false, // 禁用UDP
			filter: {
				protocols: ['ssr'], // 只保留SSR协议
				include: ['Premium'], // 只包含名称中有Premium的节点
			},
			outputFormat: 'json', // 输出JSON格式
		});

		if (result.success) {
			console.log('✅ 过滤转换成功！');
			console.log('📄 JSON格式输出:');

			if (result.data) {
				try {
					const parsed = JSON.parse(result.data);
					console.log(JSON.stringify(parsed, null, 2));
				} catch {
					console.log(result.data);
				}
			}
		}
	} catch (error) {
		console.error('💥 异常:', error);
	}
}

/**
 * 主函数：运行所有示例
 */
async function runSimpleExamples() {
	console.log('🎯 简化版代理转换器示例');
	console.log('='.repeat(60));

	try {
		await basicConversionExample();
		await base64SubscriptionExample();
		await filterOptionsExample();

		console.log('\n✅ 所有示例执行完成！');

		console.log('\n📚 核心功能总结:');
		console.log('   1. SSR协议解析 - 支持完整的SSR链接解析');
		console.log('   2. Clash格式转换 - 生成标准的Clash代理配置');
		console.log('   3. 批量处理 - 支持多个节点的批量转换');
		console.log('   4. 过滤选项 - 灵活的节点过滤和配置选项');
		console.log('   5. 多格式输出 - 支持YAML和JSON格式');
	} catch (error) {
		console.error('❌ 示例执行失败:', error);
	}
}

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
	runSimpleExamples().catch(console.error);
}

// 导出示例函数
export { base64SubscriptionExample, basicConversionExample, filterOptionsExample, runSimpleExamples };
