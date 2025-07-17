import { Router } from '@/routes/routesHandler';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 生成OpenAPI文档的脚本
 * 从后端路由系统导出标准化的OpenAPI规范
 */
async function generateOpenAPIDocument() {
	try {
		console.log('🚀 开始生成OpenAPI文档...');
		
		// 创建路由器实例
		const router = new Router();
		
		// 获取OpenAPI文档
		const openApiDoc = router.getOpenAPIDocument();
		
		// 确保输出目录存在
		const outputDir = path.join(process.cwd(), 'frontend', 'generated');
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}
		
		// 写入OpenAPI文档
		const outputPath = path.join(outputDir, 'openapi.json');
		fs.writeFileSync(outputPath, JSON.stringify(openApiDoc, null, 2), 'utf-8');
		
		console.log('✅ OpenAPI文档生成成功!');
		console.log(`📂 文档位置: ${outputPath}`);
		console.log(`📊 共包含 ${Object.keys(openApiDoc.paths || {}).length} 个路径`);
		
		// 显示生成的路径列表
		if (openApiDoc.paths) {
			console.log('\n📋 生成的API路径:');
			Object.keys(openApiDoc.paths).forEach(path => {
				const methods = Object.keys(openApiDoc.paths![path] || {}).join(', ').toUpperCase();
				console.log(`  ${methods} ${path}`);
			});
		}
		
	} catch (error) {
		console.error('❌ 生成OpenAPI文档失败:', error);
		process.exit(1);
	}
}

// 运行脚本
if (require.main === module) {
	generateOpenAPIDocument();
} 