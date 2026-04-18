import { createServerServices } from '@/server/services';
import { ResponseUtils } from '@/utils/responseUtils';
import { withAuth } from '@/utils/apiMiddleware';
import { AdminLogsQuerySchema, ResponseCodes } from '@/types/openapi-schemas';

export const runtime = 'nodejs';

export const GET = withAuth(async (request) => {
  const searchParams = request.nextUrl.searchParams;

  try {
    const { logService } = createServerServices();
    const query = {
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      level: searchParams.get('level') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      userId: searchParams.get('userId') ?? undefined,
      startTime: searchParams.get('startTime') ?? undefined,
      endTime: searchParams.get('endTime') ?? undefined,
    };
    const validationResult = AdminLogsQuerySchema.safeParse(query);
    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid query parameters', validationResult.error.format());
    }
    const { page, pageSize, level, type, userId, startTime, endTime } = validationResult.data;

    const result = await logService.queryLogs({
      limit: pageSize ?? 20,
      offset: ((page ?? 1) - 1) * (pageSize ?? 20),
      level,
      type,
      userId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    return ResponseUtils.success(result, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
