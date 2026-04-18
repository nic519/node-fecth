import { AdminService } from '@/modules/user/admin.service';
import { RegisterRequestSchema, ResponseCodes } from '@/types/openapi-schemas';
import { createServerServices } from '@/server/services';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';

/// 获取所有用户信息
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

/// 创建新用户
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
