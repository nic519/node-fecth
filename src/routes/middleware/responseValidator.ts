import { BaseResponseSchema } from '@/types/openapi-schemas';
import { Context, Next } from 'hono';

/**
 * 响应格式验证中间件
 * 确保所有API响应都符合已定义的标准格式
 * 使用 openapi-schemas.ts 中的 BaseResponseSchema 作为单一数据源
 */
export const responseValidatorMiddleware = () => {
	return async (c: Context, next: Next) => {
		// 先执行下一个中间件或路由处理器
		await next();

		// 开发环境下验证响应格式
		if (process.env.NODE_ENV === 'development') {
			try {
				// 获取响应体（如果是JSON）
				const response = c.res.clone();
				const contentType = response.headers.get('content-type');
				
				if (contentType && contentType.includes('application/json')) {
					const responseBody = await response.json();
					
					// 使用统一的Schema验证响应格式
					const validation = BaseResponseSchema.safeParse(responseBody);
					if (!validation.success) {
						console.warn(`🚨 [响应格式验证] ${c.req.method} ${c.req.path}`, {
							errors: validation.error.errors,
							actualResponse: responseBody,
							expectedFormat: 'BaseResponseSchema 定义的标准格式'
						});
					} else {
						console.log(`✅ [响应格式验证] ${c.req.method} ${c.req.path} - 格式正确`);
					}
				}
			} catch (error) {
				// 验证失败不影响实际响应
				console.warn('🚨 [响应格式验证] 验证过程出错:', error);
			}
		}
	};
};

/**
 * 严格模式中间件 - 会阻止不符合格式的响应
 * 仅建议在开发/测试环境使用
 * 使用统一的Schema定义进行严格验证
 */
export const strictResponseValidatorMiddleware = () => {
	return async (c: Context, next: Next) => {
		// 先执行下一个中间件或路由处理器
		await next();

		// 严格验证模式
		if (process.env.NODE_ENV === 'development') {
			try {
				const response = c.res.clone();
				const contentType = response.headers.get('content-type');
				
				if (contentType && contentType.includes('application/json')) {
					const responseBody = await response.json();
					
					// 使用统一的Schema进行严格验证
					const validation = BaseResponseSchema.safeParse(responseBody);
					if (!validation.success) {
						console.error(`❌ [严格响应验证] ${c.req.method} ${c.req.path} - 响应格式不符合 BaseResponseSchema`);
						
						// 替换为标准错误响应
						return c.json({
							code: 500,
							msg: '服务器响应格式错误',
							data: {
								originalResponse: responseBody,
								validationErrors: validation.error.errors,
								schemaUsed: 'BaseResponseSchema from openapi-schemas.ts',
								note: '这个错误只在开发环境显示，生产环境会正常返回'
							}
						}, 500);
					}
				}
			} catch (error) {
				console.warn('🚨 [严格响应验证] 验证过程出错:', error);
			}
		}
	};
}; 