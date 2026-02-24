import { ClashHandler } from '@/modules/yamlMerge/clashHandler';
import { AuthenticatedRequest, withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const env = process.env as unknown as Env;
  const { auth: userConfig, uid } = request;

  try {
    const clashHandler = new ClashHandler();
    const response = await clashHandler.handle(
      request as unknown as Request,
      env as unknown as Env,
      { userConfig: userConfig!, uid: uid! }
    );

    if (!response) {
      return ResponseUtils.error(500, '配置生成失败', 'CLASH_HANDLER_FAILED');
    }

    // Return the response directly as it's already a standard Response object
    return response;
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { authenticateUser: true });
