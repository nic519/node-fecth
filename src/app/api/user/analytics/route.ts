import { z } from 'zod';

import { createServerServices } from '@/server/services';
import { getSubscriptionAnalytics } from '@/services/subscription-analytics';
import type { SubscriptionUserActivity } from '@/types/subscription-analytics';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';

const QuerySchema = z.object({
  // 心跳格子条时间窗口：1 = 最近 24 小时（默认），14 = 最近 14 天；统计口径固定近 7 天
  heartbeatDays: z.coerce.number().pipe(z.union([z.literal(1), z.literal(14)])).default(1),
});

// GET: 当前登录用户自己的订阅访问心跳（统计近 7 天，心跳格子条支持 24 小时 / 14 天）
// 安全说明：服务端完成鉴权后，只从全量分析结果中挑出 userId === request.uid 的那一项返回，
// 其他用户的 IP / 心跳数据绝不会出现在响应里；该路由不需要 adminOnly。
export const GET = withAuth(async (request) => {
  const parsed = QuerySchema.safeParse({ heartbeatDays: request.nextUrl.searchParams.get('heartbeatDays') ?? undefined });
  if (!parsed.success) {
    return ResponseUtils.error(400, '心跳窗口仅支持 1 或 14 天');
  }

  const { db } = createServerServices();
  const result = await getSubscriptionAnalytics(db, { rangeDays: 7, heartbeatWindowDays: parsed.data.heartbeatDays });
  const activity: SubscriptionUserActivity | null =
    result.users.find((user) => user.userId === request.uid) ?? null;
  return ResponseUtils.success(activity);
}, { authenticateUser: true });
