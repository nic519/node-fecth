import { z } from 'zod';

import { createServerServices } from '@/server/services';
import { getSubscriptionAnalytics } from '@/services/subscription-analytics';
import { ResponseUtils } from '@/utils/responseUtils';
import { withAuth } from '@/utils/apiMiddleware';

export const runtime = 'nodejs';

const QuerySchema = z.object({
  days: z.coerce.number().pipe(z.union([z.literal(1), z.literal(7), z.literal(30)])).default(7),
  // 心跳格子条时间窗口：1 = 最近 24 小时（默认），14 = 最近 14 天
  heartbeatDays: z.coerce.number().pipe(z.union([z.literal(1), z.literal(14)])).default(1),
});

export const GET = withAuth(async (request) => {
  const parsed = QuerySchema.safeParse({
    days: request.nextUrl.searchParams.get('days') ?? undefined,
    heartbeatDays: request.nextUrl.searchParams.get('heartbeatDays') ?? undefined,
  });
  if (!parsed.success) {
    return ResponseUtils.error(400, '时间范围仅支持 1、7 或 30 天，心跳窗口仅支持 1 或 14 天');
  }

  const { db } = createServerServices();
  const result = await getSubscriptionAnalytics(db, { rangeDays: parsed.data.days, heartbeatWindowDays: parsed.data.heartbeatDays });
  return ResponseUtils.success(result, 'success');
}, { adminOnly: true });

