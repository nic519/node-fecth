import { createServerServices } from '@/server/services';
import { resolveRuntimeEnv } from '@/server/runtime';
import { isValidSuperAdminTokenValue } from '@/server/auth';
import { logs } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';
import { RegisterRequestSchema, ResponseCodes } from '@/types/api-schemas';
import { ResponseUtils } from '@/utils/responseUtils';
import { SUPER_TOKEN_QUERY_PARAM } from '@/config/constants';

function getClientIp(request: Request) {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const xForwardedFor = request.headers.get('x-forwarded-for');

  return cfConnectingIp || xForwardedFor?.split(',')[0].trim() || 'unknown';
}

function getRequestSuperToken(request: Request, bodySuperToken?: string) {
  const querySuperToken = new URL(request.url).searchParams.get(SUPER_TOKEN_QUERY_PARAM);
  return bodySuperToken || querySuperToken;
}

// POST: 公开注册用户；超级管理员令牌可跳过公开注册频控。
export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
    }

    const { uid, config, superToken } = validationResult.data;

    // 超级管理员注册不受公开注册频控限制。
    const ip = getClientIp(request);
    const requestSuperToken = getRequestSuperToken(request, superToken);
    const runtimeEnv = resolveRuntimeEnv();
    const isSuperAdmin = isValidSuperAdminTokenValue(requestSuperToken, runtimeEnv);

    const { adminService, db, logService } = createServerServices(runtimeEnv);

    if (!isSuperAdmin) {
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
    }

    // 创建用户，并按来源记录为后台创建或公开注册。
    await adminService.createUser(uid, config, isSuperAdmin ? 'admin' : 'public');

    if (!isSuperAdmin) {
      // 写入公开注册日志，供后续频控查询使用。
      await logService.log({
        level: 'info',
        type: 'public_register',
        message: `Public user registration for ${uid}`,
        meta: { ip, uid }
      });
    }

    return ResponseUtils.success(null, 'success');

  } catch (error: unknown) {
    console.error('Registration error:', error);
    return ResponseUtils.handleApiError(error);
  }
};
