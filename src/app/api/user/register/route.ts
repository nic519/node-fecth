import { createServerServices } from '@/server/services';
import { releaseRegistration, reserveRegistration } from '@/services/registration-limit';
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
    const { adminService, db } = createServerServices();
    const reservationId = await reserveRegistration(db, ip);
    if (!reservationId) {
      return ResponseUtils.error(429, '每24小时内只能创建一个账户');
    }

    try {
      await adminService.createUser(uid, config, 'public');
    } catch (error) {
      await releaseRegistration(db, ip, reservationId);
      throw error;
    }

    return ResponseUtils.success(null, 'success');

  } catch (error: unknown) {
    console.error('Registration error:', error);
    return ResponseUtils.handleApiError(error);
  }
};
