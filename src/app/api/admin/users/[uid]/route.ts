import { createServerServices } from '@/server/services';
import { ResponseUtils } from '@/utils/responseUtils';
import { withAuth } from '@/utils/apiMiddleware';

export const DELETE = withAuth(async (
  _request,
  context
) => {
  const { uid } = await context.params;

  try {
    const { adminService } = createServerServices();
    await adminService.deleteUser(uid, 'admin');

    return ResponseUtils.success(null, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
