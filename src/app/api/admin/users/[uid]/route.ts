import { AdminService } from '@/modules/user/admin.service';
import { getDb, getRuntimeEnv } from '@/db';
import { ResponseUtils } from '@/utils/responseUtils';
import { withAuth } from '@/utils/apiMiddleware';

export const DELETE = withAuth(async (
  _request,
  context
) => {
  const env = getRuntimeEnv();
  const { uid } = await context.params;

  try {
    const db = getDb(env);
    const manager = new AdminService(db, env?.SUPER_ADMIN_TOKEN);
    await manager.deleteUser(uid, 'admin');

    return ResponseUtils.success(null, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
