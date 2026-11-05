import { createServerServices } from '@/server/services';
import { ResponseUtils } from '@/utils/responseUtils';
import { UserConfigUpdateRequestSchema } from '@/modules/user/user.schema';
import type { LogService } from '@/services/log-service';
import { withAuth } from '@/utils/apiMiddleware';

// GET: 获取用户配置
export const GET = withAuth(async (request) => {
  return ResponseUtils.success(request.auth);
}, { authenticateUser: true });

// PUT: 更新用户配置
export const PUT = withAuth(async (request) => {
  const uid = request.uid!;

  let logger: LogService | undefined;
  try {
    const { userService, logService } = createServerServices();
    logger = logService;

    const body = await request.json();

    // 使用 Zod 验证请求体
    const validationResult = UserConfigUpdateRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      logger.record({ level: 'audit', type: 'user_update', message: '用户配置校验失败', userId: uid, meta: { actorId: uid, result: 'rejected' } });
      return ResponseUtils.error(400, 'Invalid request body', validationResult.error.format());
    }

    const { config } = validationResult.data;

    const success = await userService.saveUserConfig(uid, config);

    if (!success) {
      throw new Error('Update failed');
    }

    logger.record({ level: 'audit', type: 'user_update', message: '用户保存配置', userId: uid, meta: { actorId: uid, result: 'success', changedFields: Object.keys(config).filter(key => JSON.stringify(config[key as keyof typeof config]) !== JSON.stringify(request.auth?.[key as keyof typeof request.auth])) } });

    // 重新获取以返回最新数据
    const newUser = await userService.getUserConfig(uid);

    return ResponseUtils.success(newUser);
  } catch (error: unknown) {
    logger?.record({ level: 'audit', type: 'user_update', message: '用户配置保存失败', userId: uid, meta: { actorId: uid, result: 'failed' } });
    return ResponseUtils.handleApiError(error);
  }
}, { authenticateUser: true });
