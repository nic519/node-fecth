import { InnerUser } from '@/module/userManager/innerUserConfig';
import { UserManager } from '@/module/userManager/userManager';
import { TemplateManager } from '@/module/templateManager/templateManager';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { BaseRouteModule } from '@/routes/modules/base/RouteModule';
import { getSubscriptionRoute } from '@/routes/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createModuleLogger, createPerformanceTracker } from '@/utils/logger';

/**
 * 订阅功能路由模块
 */
export class SubscriptionModule extends BaseRouteModule {
	readonly moduleName = 'Subscription';
	private readonly logger = createModuleLogger(this.moduleName);

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 订阅路由
		app.openapi(getSubscriptionRoute, async (c) => {
			const query = c.req.valid('query');

			this.logger.info({
				uid: query.uid,
				token: query.token ? '***' : undefined,
				download: query.download
			}, '订阅请求开始');

			// 创建性能追踪器
			const performanceTracker = createPerformanceTracker(
				this.logger,
				'订阅处理',
				{ uid: query.uid }
			);

			// 创建超时控制
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('请求超时')), 25000); // 25秒超时
			});

			try {
				const processPromise = (async () => {
					// 用户验证阶段
					const authTracker = createPerformanceTracker(
						this.logger,
						'用户验证',
						{ uid: query.uid }
					);

					try {
						const userManager = new UserManager(c.env);
						const authConfig = await userManager.validateAndGetUser(query.uid, query.token);
						authTracker.end({ success: true });

						if (!authConfig) {
							return c.json({ error: 'Unauthorized' }, 401);
						}

						const innerUser = new InnerUser(authConfig.config);
						this.logger.info({
							uid: query.uid,
							appendSubListLength: innerUser.appendSubList?.length || 0
						}, '用户认证成功');

						// 检查配置复杂度，防止资源过载
						if (innerUser.appendSubList && innerUser.appendSubList.length > 10) {
							this.logger.warn({
								uid: query.uid,
								appendSubListLength: innerUser.appendSubList.length,
								maxAllowed: 10
							}, '用户配置过多追加订阅');
							return c.json({ error: 'Too many subscriptions configured' }, 400);
						}

						// Clash处理阶段
						const clashTracker = createPerformanceTracker(
							this.logger,
							'Clash处理',
							{ uid: query.uid }
						);

						try {
							const clashHandler = new ClashHandler();
							const response = await clashHandler.handle(c.req.raw, c.env, { innerUser: innerUser });
							clashTracker.end({ success: true });

							if (!response) {
								this.logger.error({ uid: query.uid }, 'ClashHandler 返回空响应');
								return c.text('Clash handler failed', 500);
							}

							performanceTracker.end({ success: true });
							return response as any;
						} catch (error) {
							clashTracker.error(error as Error);
							throw error;
						}
					} catch (error) {
						authTracker.error(error as Error);
						throw error;
					}
				})();

				// 使用 Promise.race 实现超时控制
				const result = await Promise.race([processPromise, timeoutPromise]);
				return result;
			} catch (error) {
				performanceTracker.error(error as Error);

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
			const templateId = c.req.param('templateId');
			const download = c.req.query('download');
			const filename = c.req.query('filename');

			const performanceTracker = createPerformanceTracker(
				this.logger,
				'模板预览',
				{ templateId, download, filename }
			);

			try {
				const templateManager = new TemplateManager(c.env);
				const template = await templateManager.getTemplateById(templateId);

				if (!template) {
					performanceTracker.end({ success: false, reason: 'template_not_found' });
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

				performanceTracker.end({
					success: true,
					contentLength: content.length,
					hasDownload: !!download
				});

				return new Response(content, { headers });
			} catch (error) {
				performanceTracker.error(error as Error);
				return c.text('获取模板失败', 500);
			}
		});
	}
}
