import { ClashHandler } from '@/modules/yamlMerge/clashHandler';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';

// GET: 生成当前用户的订阅配置。
export const GET = withAuth(async (request) => {
  const { auth: userConfig, uid } = request;

  try {
    const clashHandler = new ClashHandler();
    const response = await clashHandler.handle(
      request as unknown as Request,
      { userConfig: userConfig!, uid: uid! }
    );

    if (!response) {
      return ResponseUtils.error(500, '配置生成失败', 'CLASH_HANDLER_FAILED');
    }

    // ClashHandler 已经返回标准 Response，这里直接透传。
    return response;
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { authenticateUser: true });
