import { ResponseUtils } from '@/utils/responseUtils';
import { ClashHandler } from '@/modules/yamlMerge/clashHandler';
import { withAuth, type AuthenticatedRequest } from '@/utils/apiMiddleware';
import { createLogService } from '@/services/log-service';
import { LogType } from '@/types/log';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const env = process.env as unknown as Env;
  const logger = createLogService(env);
  const uid = request.uid;

  try {
    const authConfig = request.auth;

    if (!authConfig) {
      return ResponseUtils.error(500, '用户配置加载失败');
    }

    if (!authConfig.subscribe) {
      return ResponseUtils.error(400, '用户配置中缺少订阅URL');
    }

    void logger.log({
      level: 'info',
      type: LogType.SUBSCRIPTION_ACCESS,
      message: '用户访问订阅配置',
      userId: uid,
      meta: {
        url: request.url,
        method: request.method,
        subscribe: authConfig.subscribe,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || undefined,
      },
    });

    const clashHandler = new ClashHandler();
    const response = await clashHandler.handle(request as unknown as Request, env as unknown as Env, { userConfig: authConfig });

    if (!response) {
      return ResponseUtils.error(500, '配置生成失败');
    }

    return response;
  } catch (error: unknown) {
    void logger.log({
      level: 'error',
      type: LogType.SUBSCRIPTION_ACCESS,
      message: '订阅配置生成失败',
      userId: uid,
      meta: {
        url: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return ResponseUtils.handleApiError(error);
  }
}, { authenticateUser: true });
