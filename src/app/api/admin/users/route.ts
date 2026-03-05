import { AdminService } from '@/modules/user/admin.service';
import { RegisterRequestSchema, ResponseCodes } from '@/types/openapi-schemas';
import { withAuth } from '@/utils/apiMiddleware';
import { getDb } from '@/db';
import { ResponseUtils } from '@/utils/responseUtils';

/// 获取所有用户信息
export const GET = withAuth(async () => {
  const env = process.env as unknown as Env;

  try {
    const db = getDb(env);
    // Note: Assuming env.USERS_KV is available on process.env or global env
    const manager = new AdminService(db, env.SUPER_ADMIN_TOKEN);
    const users = await manager.getUserSummaryList();

    return ResponseUtils.success({
      users
    }, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });

/// 创建新用户
export const POST = async (request: Request) => {
  const env = process.env as unknown as Env;

  try {
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
    }
    const { uid, config, superToken } = validationResult.data;

    const superAdminToken = process.env.SUPER_ADMIN_TOKEN || env.SUPER_ADMIN_TOKEN;
    if (!superAdminToken || superToken !== superAdminToken) {
      return ResponseUtils.error(401, 'Unauthorized');
    }

    const db = getDb(env);
    const manager = new AdminService(db, env.SUPER_ADMIN_TOKEN);
    await manager.createUser(uid, config, 'admin'); // 'admin' is hardcoded adminId for now

    return ResponseUtils.success(null, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
};
