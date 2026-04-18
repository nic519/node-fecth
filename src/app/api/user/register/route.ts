import { createServerServices } from '@/server/services';
import { getSuperAdminToken, resolveRuntimeEnv } from '@/server/runtime';
import { isValidSuperAdminTokenValue } from '@/server/auth';
import { logs } from '@/db/schema';
import { sql, and, eq } from 'drizzle-orm';
import { RegisterRequestSchema, ResponseCodes } from '@/types/openapi-schemas';
import { ResponseUtils } from '@/utils/responseUtils';
import { SUPER_TOKEN_QUERY_PARAM } from '@/config/constants';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const validationResult = RegisterRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
    }
    const { uid, config, superToken } = validationResult.data;

    // Get IP address
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    const ip = cfConnectingIp || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : 'unknown');

    // Check for Super Token (Bypass limit)
    const url = new URL(request.url);
    const querySuperToken = url.searchParams.get(SUPER_TOKEN_QUERY_PARAM);
    const requestSuperToken = superToken || querySuperToken;
    const runtimeEnv = resolveRuntimeEnv();
    const isSuperAdmin = isValidSuperAdminTokenValue(requestSuperToken, runtimeEnv);

    const { adminService, db, logService } = createServerServices(runtimeEnv);

    if (!isSuperAdmin) {
      // Rate Limit Check
      // Check if this IP has registered in the last 24 hours
      // We look for 'public_register' logs

      // SQLite JSON query: meta->>'ip'
      // We use SQLite's datetime function to compare times directly in the database

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

    // Create User
    await adminService.createUser(uid, config, isSuperAdmin ? 'admin' : 'public');

    // Log the public registration for rate limiting
    if (!isSuperAdmin) {
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
