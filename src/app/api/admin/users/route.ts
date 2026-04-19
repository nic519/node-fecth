import { RegisterRequestSchema, ResponseCodes } from '@/types/api-schemas';
import { createServerServices } from '@/server/services';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';

// GET: 获取所有用户摘要信息。
export const GET = withAuth(async () => {
  try {
    const { adminService } = createServerServices();
    const users = await adminService.getUserSummaryList();

    return ResponseUtils.success({
      users
    }, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });

// POST: 后台创建新用户。
export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
    }

    const { uid, config } = validationResult.data;

    const { adminService } = createServerServices();
    await adminService.createUser(uid, config, 'admin');

    return ResponseUtils.success(null, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
