import { ResponseCodes } from '@/types/openapi-schemas';
import { BaseResponseSchema } from '@/routes/modules/base/schema.base';
import { Context, Next } from 'hono';
import { GlobalConfig } from '../../config/global-config';

/**
 * 响应格式验证中间件
 * 确保所有API响应都符合已定义的标准格式
 * 使用 openapi-schemas.ts 中的 BaseResponseSchema 作为单一数据源
 */
export const responseValidatorMiddleware = () => {
	return async (c: Context, next: Next) => {
		// 先执行下一个中间件或路由处理器
		await next();
 
		try {
			// 获取响应体（如果是JSON）
			const response = c.res.clone();
			const contentType = response.headers.get('content-type');

			if (contentType && contentType.includes('application/json')) {
				const responseBody = await response.json() as any;

				// 检查是否是 OpenAPI 验证错误响应（ZodError 格式）
				if (responseBody.error && responseBody.error.name === 'ZodError') {
					console.warn(`🚨 [OpenAPI验证错误] ${c.req.method} ${c.req.path}`, {
						error: responseBody.error,
						actualResponse: responseBody,
					});
					// 对于 OpenAPI 验证错误，转换为标准格式
					return c.json({
						code: ResponseCodes.INVALID_PARAMS,
						msg: '请求参数验证失败',
						data: responseBody.error.issues,
					}, 400);
				}

				// 使用统一的Schema验证响应格式
				const validation = BaseResponseSchema.safeParse(responseBody);
				if (!validation.success) {
					console.warn(`🚨 [响应格式验证] ${c.req.method} ${c.req.path}`, {
						errors: validation.error.errors,
						actualResponse: responseBody,
						expectedFormat: 'BaseResponseSchema 定义的标准格式',
					});
					// 只在非开发环境下进行格式转换，避免影响调试
					if (!GlobalConfig.isDev) {
						return c.json({
							code: ResponseCodes.FORMAT_ERROR,
							msg: '响应格式错误',
							data: validation.error.errors,
						});
					}
				} else {
					console.log(`✅ [响应格式验证] ${c.req.method} ${c.req.path} - 格式正确`);
				}
			}
		} catch (error) {
			// 验证失败不影响实际响应
			console.warn('🚨 [响应格式验证] 验证过程出错:', error);
		} 
	};
};
