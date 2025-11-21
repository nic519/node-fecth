import { TemplateManager } from '@/module/templateManager/templateManager';
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { ClashHandler } from '@/routes/handler/clashHandler';
import { BaseAPI } from '@/routes/modules/base/api.base';
import { getSubscriptionRoute } from '@/routes/openapi';
import { AuthUtils } from '@/utils/authUtils';
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

			try {
				// 用户验证
				const authConfig = await AuthUtils.authenticate(c.req.raw, c.env, query.uid);
				const innerUser = new InnerUser(authConfig.config);

				// 验证必要的配置项
				if (!innerUser.subscribe) {
					return c.json(
						{
							error: 'Missing subscription configuration',
							message: '用户配置中缺少订阅URL',
							code: 'MISSING_SUBSCRIPTION',
						},
						400
					);
				}

				// Clash处理
				const clashHandler = new ClashHandler();
				const response = await clashHandler.handle(c.req.raw, c.env, { innerUser });

				if (!response) {
					return c.json(
						{
							error: 'Clash handler failed',
							message: '配置生成失败',
							code: 'CLASH_HANDLER_FAILED',
						},
						500
					);
				}

				return response as any;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);

				// 认证失败
				if (errorMessage.includes('no access token') || errorMessage.includes('Invalid access token')) {
					return c.json(
						{
							error: 'Unauthorized',
							message: '用户认证失败',
							code: 'AUTH_FAILED',
						},
						401
					) as any;
				}

				// 其他错误
				return c.json(
					{
						error: 'Internal Server Error',
						message: '服务器内部错误',
						detail: errorMessage,
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
