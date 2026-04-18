import { createServerServices } from '@/server/services';
import { ResponseUtils } from '@/utils/responseUtils';
import { ClashHandler } from '@/modules/yamlMerge/clashHandler';
import { withAuth, type AuthenticatedRequest } from '@/utils/apiMiddleware';
import { LogType } from '@/types/log';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { logService } = createServerServices();
  const uid = request.uid;

  try {
    const authConfig = request.auth;

    if (!authConfig) {
      return ResponseUtils.error(500, '用户配置加载失败');
    }

    void logService.log({
      level: 'info',
      type: LogType.SUBSCRIPTION_ACCESS,
      message: '用户访问订阅配置',
      userId: uid,
      meta: {
        url: request.url,
        method: request.method,
        subscribe: authConfig.subscribe,
        headers: Object.fromEntries(request.headers.entries()),
      },
    });

    const clashHandler = new ClashHandler();
    const response = await clashHandler.handle(request as unknown as Request, { userConfig: authConfig, uid });

    if (!response) {
      return ResponseUtils.error(500, '配置生成失败');
    }

    return response;
  } catch (error: unknown) {
    void logService.log({
      level: 'error',
      type: LogType.SUBSCRIPTION_ACCESS,
      message: '订阅配置生成失败',
      userId: uid,
      meta: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return ResponseUtils.handleApiError(error);
  }
}, { authenticateUser: true });
