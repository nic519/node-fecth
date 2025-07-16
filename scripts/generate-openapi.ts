import { Router } from '@/routes/routesHandler';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'openapi.json');

function generateOpenApiDoc() {
	try {
		console.log('🔄 正在从路由定义自动生成 OpenAPI 文档...');

		// 直接使用现有的Router实例，它已经注册了所有路由
		const router = new Router();

		// 获取OpenAPI文档
		const openApiDoc = router.getOpenAPIDocument();

		// 格式化并写入文件
		const formattedJson = JSON.stringify(openApiDoc, null, 2);
		fs.writeFileSync(OUTPUT_FILE, formattedJson, 'utf8');

		console.log('✅ OpenAPI 文档已成功更新到:', OUTPUT_FILE);
		console.log(`📊 包含 ${Object.keys(openApiDoc.paths || {}).length} 个路径`);

		// 统计路由信息
		const paths = openApiDoc.paths || {};
		const totalRoutes = Object.keys(paths).length;
		const methodCounts = Object.values(paths).reduce((acc: any, pathMethods: any) => {
			Object.keys(pathMethods).forEach((method) => {
				acc[method.toUpperCase()] = (acc[method.toUpperCase()] || 0) + 1;
			});
			return acc;
		}, {});

		console.log('📈 路由统计:');
		Object.entries(methodCounts).forEach(([method, count]) => {
			console.log(`   ${method}: ${count} 个路由`);
		});
	} catch (error) {
		console.error('❌ 生成 OpenAPI 文档失败:');
		if (error instanceof Error) {
			console.error(`   错误: ${error.message}`);
			console.error(`   堆栈: ${error.stack}`);
		} else {
			console.error('   未知错误:', error);
		}
		process.exit(1);
	}
}

function main() {
	console.log('🚀 自动化 OpenAPI 文档生成器');
	console.log('💡 新增路由时无需修改此脚本，自动检测所有已注册路由');

	generateOpenApiDoc();

	console.log('');
	console.log('✨ 生成完成！你现在可以:');
	console.log('   1. 查看文档: http://localhost:8787/docs (开发环境)');
	console.log('   2. 获取规范: http://localhost:8787/openapi.json');
	console.log('   3. 静态文件: public/openapi.json');
}

main();
