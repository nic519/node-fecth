import { z } from 'zod';

import { createServerServices } from '@/server/services';
import { getSubscriptionAnalytics } from '@/services/subscription-analytics';
import { ResponseUtils } from '@/utils/responseUtils';
import { withAuth } from '@/utils/apiMiddleware';

export const runtime = 'nodejs';

const QuerySchema = z.object({
  days: z.coerce.number().pipe(z.union([z.literal(1), z.literal(7), z.literal(30)])).default(7),
});

export const GET = withAuth(async (request) => {
  const parsed = QuerySchema.safeParse({ days: request.nextUrl.searchParams.get('days') ?? undefined });
  if (!parsed.success) {
    return ResponseUtils.error(400, '时间范围仅支持 1、7 或 30 天');
  }

  const { db } = createServerServices();
  const result = await getSubscriptionAnalytics(db, { rangeDays: parsed.data.days });
  return ResponseUtils.success(result, 'success');
}, { adminOnly: true });

