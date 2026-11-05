import { createServerServices } from '@/server/services';
import { logs } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';
import { RegisterRequestSchema, ResponseCodes } from '@/types/api-schemas';
import { ResponseUtils } from '@/utils/responseUtils';

function getClientIp(request: Request) {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const xForwardedFor = request.headers.get('x-forwarded-for');

  return cfConnectingIp || xForwardedFor?.split(',')[0].trim() || 'unknown';
}

// POST: 公开注册用户。
export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
    }

    const { uid, config } = validationResult.data;
    const ip = getClientIp(request);
    const { adminService, db, logService } = createServerServices();

    // 按 IP 限制公开注册频率：同一 IP 24 小时内只能注册一次。
    const recentRegistrations = await db.select({
      id: logs.id
    }).from(logs)
      .where(and(
        eq(logs.type, 'public_register'),
        sql`json_extract(${logs.meta}, '$.ip') = ${ip}`,
        sql`datetime(${logs.createdAt}) > datetime('now', '-1 day')`
      ))
      .limit(1);

    if (recentRegistrations.length > 0) {
      return ResponseUtils.error(429, '每24小时内只能创建一个账户');
    }

    await adminService.createUser(uid, config, 'public');
    await logService.log({
      level: 'info',
      type: 'public_register',
      message: `Public user registration for ${uid}`,
      meta: { ip, uid }
    });

    return ResponseUtils.success(null, 'success');

  } catch (error: unknown) {
    console.error('Registration error:', error);
    return ResponseUtils.handleApiError(error);
  }
};
