import { z } from 'zod';

import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { DynamicHistoryCursorSchema } from '@/types/schema/dynamic';
import { withAuth } from '@/utils/apiMiddleware';
import { CommonUtils } from '@/utils/commonUtils';
import { ResponseUtils } from '@/utils/responseUtils';

const requestSchema = z.object({
  url: z.string().refine((url) => z.url().safeParse(CommonUtils.normalizeUrl(url)).success),
  cursor: DynamicHistoryCursorSchema.optional(),
});

export const POST = withAuth(async (request) => {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return ResponseUtils.error(400, '订阅源或分页参数无效');

  const { url, cursor } = parsed.data;
  return ResponseUtils.success(await DynamicService.getHistory(url, cursor));
}, { adminOnly: true });
