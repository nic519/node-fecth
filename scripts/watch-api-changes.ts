import { ApiClientGenerator } from './generate-api-client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 监听API变化并自动重新生成客户端
 */
class ApiWatcher {
	private generator: ApiClientGenerator;
	private watchPaths: string[];
	private debounceTimer?: NodeJS.Timeout;
	private isGenerating = false;

	constructor() {
		this.generator = new ApiClientGenerator();
		this.watchPaths = [
			'src/routes/openapi',
			'src/routes/modules',
			'src/types/openapi-schemas.ts',
			'src/routes/routesHandler.ts'
		];
	}

	/**
	 * 开始监听
	 */
	async start(): Promise<void> {
		console.log('👁️  开始监听API变化...');
		console.log('📂 监听目录:');
		this.watchPaths.forEach(p => console.log(`  - ${p}`));

		// 初始生成
		await this.generateClient();

		// 设置文件监听
		this.setupWatchers();

		console.log('✅ API监听器已启动');
		console.log('💡 提示: 修改API定义文件时会自动重新生成客户端');
	}

	/**
	 * 设置文件监听器
	 */
	private setupWatchers(): void {
		this.watchPaths.forEach(watchPath => {
			const fullPath = path.join(process.cwd(), watchPath);
			
			if (fs.existsSync(fullPath)) {
				fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
					if (filename && this.shouldTriggerRegeneration(filename)) {
						this.debouncedGenerate();
					}
				});
			}
		});
	}

	/**
	 * 判断是否应该触发重新生成
	 */
	private shouldTriggerRegeneration(filename: string): boolean {
		const ext = path.extname(filename);
		return ext === '.ts' || ext === '.js';
	}

	/**
	 * 防抖生成
	 */
	private debouncedGenerate(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.generateClient();
		}, 1000); // 1秒防抖
	}

	/**
	 * 生成客户端
	 */
	private async generateClient(): Promise<void> {
		if (this.isGenerating) {
			console.log('⏳ 生成中，跳过此次触发...');
			return;
		}

		this.isGenerating = true;
		
		try {
			console.log('\n🔄 检测到API变化，重新生成客户端...');
			await this.generator.generate();
			console.log('🎉 客户端重新生成完成!\n');
		} catch (error) {
			console.error('❌ 客户端生成失败:', error);
		} finally {
			this.isGenerating = false;
		}
	}
}

/**
 * 主函数
 */
async function main() {
	const watcher = new ApiWatcher();
	
	// 处理进程退出
	process.on('SIGINT', () => {
		console.log('\n👋 停止API监听器');
		process.exit(0);
	});

	await watcher.start();
}

// 运行脚本
if (require.main === module) {
	main().catch(error => {
		console.error('❌ API监听器启动失败:', error);
		process.exit(1);
	});
} 