import { createServerServices } from '@/server/services';
import { ResponseUtils } from '@/utils/responseUtils';
import { withAuth } from '@/utils/apiMiddleware';

// DELETE: 后台删除指定用户。
export const DELETE = withAuth(async (_request, { params }) => {
  const { uid } = await params;

  try {
    const { adminService } = createServerServices();
    await adminService.deleteUser(uid, 'admin');

    return ResponseUtils.success(null, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
