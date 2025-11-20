import { TemplateManager } from '@/module/templateManager/templateManager';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { UserManager } from '@/module/userManager/userManager';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { BaseAPI } from '@/routes/modules/base/api.base';
import { getSubscriptionRoute } from '@/routes/openapi';
import { createModuleLogger, createPerformanceTracker } from '@/utils/logger';
import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * 订阅功能路由模块
 */
export class APIProxy extends BaseAPI {
	private readonly logger = createModuleLogger(this.moduleName);

	register(app: OpenAPIHono<{ Bindings: Env }>): void {
		// 订阅路由
		app.openapi(getSubscriptionRoute, async (c) => {
			const query = c.req.valid('query');

			this.logger.info(
				{
					uid: query.uid,
					token: query.token ? '***' : undefined,
					download: query.download,
				},
				'订阅请求开始'
			);

			// 创建性能追踪器
			const performanceTracker = createPerformanceTracker(this.logger, '订阅处理', { uid: query.uid });

			// 创建超时控制
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('请求超时')), 25000); // 25秒超时
			});

			try {
				const processPromise = (async () => {
					// 用户验证阶段
					const authTracker = createPerformanceTracker(this.logger, '用户验证', { uid: query.uid });

					try {
						const userManager = new UserManager(c.env);
						const authConfig = await userManager.validateAndGetUser(query.uid, query.token);
						authTracker.end({ success: true });

						if (!authConfig) {
							this.logger.warn({ uid: query.uid }, '用户认证失败：配置不存在或token无效');
							return c.json(
								{
									error: 'Unauthorized',
									message: '用户认证失败，请检查uid和token是否正确',
									code: 'AUTH_FAILED',
								},
								401
							);
						}

						const innerUser = new InnerUser(authConfig.config);
						this.logger.info(
							{
								uid: query.uid,
								appendSubListLength: innerUser.appendSubList?.length || 0,
								hasRuleUrl: !!innerUser.ruleUrl,
								hasSubscribe: !!innerUser.subscribe,
								multiPortMode: innerUser.multiPortMode,
							},
							'用户认证成功，配置信息加载完成'
						);

						// 检查配置复杂度，防止资源过载
						if (innerUser.appendSubList && innerUser.appendSubList.length > 10) {
							this.logger.warn(
								{
									uid: query.uid,
									appendSubListLength: innerUser.appendSubList.length,
									maxAllowed: 10,
								},
								'用户配置过多追加订阅'
							);
							return c.json(
								{
									error: 'Too many subscriptions configured',
									message: '追加订阅数量不能超过10个',
									code: 'TOO_MANY_SUBSCRIPTIONS',
								},
								400
							);
						}

						// 验证必要的配置项
						if (!innerUser.subscribe) {
							this.logger.error({ uid: query.uid }, '缺少必要的订阅URL配置');
							return c.json(
								{
									error: 'Missing subscription configuration',
									message: '用户配置中缺少订阅URL',
									code: 'MISSING_SUBSCRIPTION',
								},
								400
							);
						}

						// Clash处理阶段
						const clashTracker = createPerformanceTracker(this.logger, 'Clash处理', { uid: query.uid });

						try {
							const clashHandler = new ClashHandler();
							const response = await clashHandler.handle(c.req.raw, c.env, { innerUser: innerUser });
							clashTracker.end({ success: true });

							if (!response) {
								this.logger.error({ uid: query.uid }, 'ClashHandler 返回空响应');
								return c.json(
									{
										error: 'Clash handler failed',
										message: '配置生成失败，处理器返回空响应',
										code: 'CLASH_HANDLER_FAILED',
									},
									500
								);
							}

							performanceTracker.end({ success: true });
							return response as any;
						} catch (error) {
							clashTracker.error(error as Error);
							this.logger.error(
								{
									uid: query.uid,
									error: error instanceof Error ? error.message : String(error),
									stack: error instanceof Error ? error.stack : undefined,
								},
								'Clash处理阶段发生错误'
							);
							throw error;
						}
					} catch (error) {
						authTracker.error(error as Error);
						this.logger.error(
							{
								uid: query.uid,
								error: error instanceof Error ? error.message : String(error),
								stack: error instanceof Error ? error.stack : undefined,
							},
							'用户验证阶段发生错误'
						);
						throw error;
					}
				})();

				// 使用 Promise.race 实现超时控制
				const result = await Promise.race([processPromise, timeoutPromise]);
				return result;
			} catch (error) {
				performanceTracker.error(error as Error);

				// 详细的错误分类处理
				if (error instanceof Error) {
					const errorMessage = error.message.toLowerCase();

					if (error.message === '请求超时') {
						this.logger.error({ uid: query.uid }, '请求处理超时');
						return c.json(
							{
								error: 'Request timeout',
								message: '请求处理超时，请稍后重试',
								code: 'TIMEOUT',
							},
							408
						);
					}

					if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
						this.logger.error({ uid: query.uid, error: error.message }, '网络请求失败');
						return c.json(
							{
								error: 'Network error',
								message: '网络请求失败，请检查网络连接或稍后重试',
								code: 'NETWORK_ERROR',
							},
							502
						);
					}

					if (errorMessage.includes('模板') || errorMessage.includes('template')) {
						this.logger.error({ uid: query.uid, error: error.message }, '模板获取失败');
						return c.json(
							{
								error: 'Template error',
								message: '模板获取失败，请检查模板配置',
								code: 'TEMPLATE_ERROR',
							},
							400
						);
					}

					if (errorMessage.includes('验证') || errorMessage.includes('validation')) {
						this.logger.error({ uid: query.uid, error: error.message }, '配置验证失败');
						return c.json(
							{
								error: 'Validation error',
								message: '配置验证失败，请检查用户配置格式',
								code: 'VALIDATION_ERROR',
							},
							400
						);
					}
				}

				// 通用错误处理
				const errorResponse = this.handleError(error, '订阅路由处理');
				this.logger.error(
					{
						uid: query.uid,
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					},
					'订阅处理发生未知错误'
				);

				return c.json(
					{
						...errorResponse,
						error: 'Internal Server Error',
						message: '服务器内部错误，请稍后重试',
						code: 'INTERNAL_ERROR',
					},
					500
				) as any;
			}
		});

		// 模板预览端点 - 不需要用户认证，直接返回模板配置
		app.get('/api/subscription/template/:templateId', async (c) => {
			const templateId = c.req.param('templateId');
			const download = c.req.query('download');
			const filename = c.req.query('filename');

			const performanceTracker = createPerformanceTracker(this.logger, '模板预览', { templateId, download, filename });

			try {
				const templateManager = new TemplateManager(c.env);
				const template = await templateManager.getTemplateById(templateId);

				if (!template) {
					performanceTracker.end({ success: false, reason: 'template_not_found' });
					return c.json(
						{
							error: 'Template not found',
							message: `模板 ${templateId} 不存在`,
							code: 'TEMPLATE_NOT_FOUND',
						},
						404
					);
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
					hasDownload: !!download,
				});

				return new Response(content, { headers });
			} catch (error) {
				performanceTracker.error(error as Error);
				this.logger.error(
					{
						templateId,
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
					},
					'模板预览发生错误'
				);

				return c.json(
					{
						error: 'Internal Server Error',
						message: '获取模板失败，请稍后重试',
						code: 'TEMPLATE_FETCH_ERROR',
					},
					500
				);
			}
		});
	}
}
