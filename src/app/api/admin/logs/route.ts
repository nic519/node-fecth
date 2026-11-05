import { createServerServices } from '@/server/services';
import { ResponseUtils } from '@/utils/responseUtils';
import { withAuth } from '@/utils/apiMiddleware';
import { AdminLogsQuerySchema, ResponseCodes } from '@/types/api-schemas';

export const runtime = 'nodejs';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

// GET: 按分页和筛选条件查询后台日志。
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
      order: searchParams.get('order') ?? undefined,
    };
    const validationResult = AdminLogsQuerySchema.safeParse(query);
    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid query parameters', validationResult.error.format());
    }

    const { page, pageSize, level, type, userId, startTime, endTime, order } = validationResult.data;
    const limit = pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = ((page ?? DEFAULT_PAGE) - 1) * limit;

    const result = await logService.queryLogs({
      limit,
      offset,
      level,
      type,
      userId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      order,
    });

    return ResponseUtils.success(result, 'success');
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
