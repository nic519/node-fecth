import { UserService } from '@/modules/user/user.service';
import { ResponseUtils } from '@/utils/responseUtils';
import { ScUserUpdateReq } from '@/modules/user/user.schema';
import { withAuth } from '@/utils/apiMiddleware';
import { getDb } from '@/db';

// GET: 获取用户配置
export const GET = withAuth(async (request) => {
  return ResponseUtils.success(request.auth);
}, { authenticateUser: true });

// PUT: 更新用户配置
export const PUT = withAuth(async (request) => {
  const env = process.env as unknown as Env;
  const uid = request.uid!;

  try {
    const db = getDb(env);
    const userService = new UserService(db);

    const body = await request.json();

    // 使用 Zod 验证请求体
    const validationResult = ScUserUpdateReq.safeParse(body);
    
    if (!validationResult.success) {
      return ResponseUtils.error(400, 'Invalid request body', validationResult.error.format());
    }

    const { config } = validationResult.data;

    const success = await userService.saveUserConfig(uid, config);

    if (!success) {
      throw new Error('Update failed');
    }

    // 重新获取以返回最新数据
    const newUser = await userService.getUserConfig(uid);

    return ResponseUtils.success(newUser);
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { authenticateUser: true });
