import { ResponseCodes } from '@/types/openapi-schemas';
import { AuthUtils } from '@/utils/authUtils';

/**
 * 用户身份验证钩子
 * 从路径参数和查询参数中获取 uid 和 token 进行验证
 */
export const userAuthHook = async (c: any): Promise<void | Response> => {
	const uid = c.req.query('uid');
	const token = c.req.query('token');

	console.log(`🔐 用户验证钩子: uid=${uid}, token=${token ? '***' : 'undefined'}`);

	if (!uid || !token) {
		console.error(`❌ 用户验证失败: 缺少必要的认证参数`);
		return c.json(
			{
				code: ResponseCodes.UNAUTHORIZED,
				msg: '缺少必要的认证参数（uid 或 token）',
			},
			401
		);
	}

	try {
		const authResult = await AuthUtils.authenticate(c.req.raw, c.env, uid);
		console.log(`✅ 用户验证成功: ${uid} `);
		// 验证成功，不返回任何内容，继续执行后续操作
	} catch (error) {
		console.error(`❌ 用户验证失败: ${uid}`, error);
		return c.json(
			{
				code: ResponseCodes.UNAUTHORIZED,
				msg: error instanceof Error ? error.message : '身份验证失败',
			},
			401
		);
	}
};
