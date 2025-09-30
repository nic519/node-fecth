import { InnerUser } from '@/module/userManager/innerUserConfig';
import { UserManager } from '@/module/userManager/userManager';
import { TemplateManager } from '@/module/templateManager/templateManager';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { getSubscriptionRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 订阅功能路由模块
 */
export class SubscriptionModule extends BaseRouteModule {
	readonly moduleName = 'Subscription';

	// 资源使用监控
	private logResourceUsage(step: string, startTime: number) {
		const currentTime = Date.now();
		const duration = currentTime - startTime;
		console.log(`⏱️ [${this.moduleName}] ${step}: ${duration}ms`);
		
		// 警告超长处理时间
		if (duration > 10000) {
			console.warn(`⚠️ [${this.moduleName}] ${step} 耗时过长: ${duration}ms`);
		}
	}

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 订阅路由
		app.openapi(getSubscriptionRoute, async (c) => {
			const startTime = Date.now();
			const query = c.req.valid('query');

			console.log(`📡 ${this.moduleName}: ${query.uid}`, query);

			// 创建超时控制
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('请求超时')), 25000); // 25秒超时
			});

			try {
				const processPromise = (async () => {
					// 用户验证阶段
					const authStartTime = Date.now();
					const userManager = new UserManager(c.env);
					const authConfig = await userManager.validateAndGetUser(query.uid, query.token);
					this.logResourceUsage('用户验证', authStartTime);

					if (!authConfig) {
						return c.json({ error: 'Unauthorized' }, 401);
					}

					const innerUser = new InnerUser(authConfig.config);
					console.log(`👤 ${this.moduleName}: 用户认证成功 ${query.uid}`);

					// 检查配置复杂度，防止资源过载
					if (innerUser.appendSubList && innerUser.appendSubList.length > 10) {
						console.warn(`⚠️ 用户 ${query.uid} 配置了过多追加订阅 (${innerUser.appendSubList.length})`);
						return c.json({ error: 'Too many subscriptions configured' }, 400);
					}

					// Clash处理阶段
					const clashStartTime = Date.now();
					const clashHandler = new ClashHandler();
					const response = await clashHandler.handle(c.req.raw, c.env, { innerUser: innerUser });
					this.logResourceUsage('Clash处理', clashStartTime);
					
					if (!response) {
						console.error(`❌ ClashHandler 返回空响应`);
						return c.text('Clash handler failed', 500);
					}
					
					this.logResourceUsage('总处理时间', startTime);
					return response as any;
				})();

				// 使用 Promise.race 实现超时控制
				const result = await Promise.race([processPromise, timeoutPromise]);
				return result;
			} catch (error) {
				this.logResourceUsage('错误处理', startTime);
				console.error(`❌ ${this.moduleName} 处理失败:`, error);
				
				if (error instanceof Error) {
					if (error.message === '请求超时') {
						return c.json({ error: 'Request timeout' }, 408);
					}
					if (error.message.includes('fetch')) {
						return c.json({ error: 'Network error' }, 502);
					}
				}
				
				const errorResponse = this.handleError(error, '订阅路由处理');
				return c.json(
					{
						...errorResponse,
						error: 'Bad Request',
					},
					400
				) as any;
			}
		});

		// 模板预览端点 - 不需要用户认证，直接返回模板配置
		app.get('/api/subscription/template/:templateId', async (c) => {
			const startTime = Date.now();
			const templateId = c.req.param('templateId');
			const download = c.req.query('download');
			const filename = c.req.query('filename');

			console.log(`📋 ${this.moduleName}: 预览模板 ${templateId}`);

			try {
				const templateManager = new TemplateManager(c.env);
				const template = await templateManager.getTemplateById(templateId);

				if (!template) {
					return c.text('模板不存在', 404);
				}

				// 直接返回模板内容
				const content = template.content || '';

				// 设置响应头
				const headers = new Headers();
				headers.set('Content-Type', 'text/yaml; charset=utf-8');

				if (download === 'true' || filename) {
					const finalFilename = filename || `clash-template-${templateId}.yaml`;
					headers.set('Content-Disposition', `attachment; filename="${finalFilename}"`);
				}

				this.logResourceUsage('模板预览', startTime);
				return new Response(content, { headers });
			} catch (error) {
				console.error(`❌ ${this.moduleName} 模板预览失败:`, error);
				return c.text('获取模板失败', 500);
			}
		});
	}
}
