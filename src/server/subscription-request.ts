import { after } from 'next/server';
import { withAuth } from '@/utils/apiMiddleware';
import { createServerServices } from '@/server/services';
import { ClashHandler } from '@/modules/yamlMerge/clashHandler';
import type { SubscriptionOutcome } from '@/modules/yamlMerge/strategyMultiSub';
import { recordSubscriptionAccess } from '@/services/subscription-analytics';
import { safeError } from '@/utils/logHelper';

export const subscriptionRequest = withAuth(async request => {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const outcome: SubscriptionOutcome = { sourceCount: 0, successCount: 0, failedCount: 0, staleCount: 0, failures: [] };
  const meta: Record<string, unknown> = {};
  let response: Response;
  try {
    response = await new ClashHandler().handle(request, { userConfig: request.auth, uid: request.uid, outcome, meta })
      ?? new Response('配置生成失败', { status: 500 });
  } catch (error) {
    meta.error = safeError(error);
    response = new Response('配置生成失败', { status: 500 });
  }
  const result = response.status >= 400 || (outcome.sourceCount > 0 && outcome.successCount === 0 && outcome.failedCount > 0) ? 'failure' : outcome.failedCount || outcome.staleCount ? 'partial' : 'success';
  const durationMs = Date.now() - started;
  try {
    after(async () => {
      try {
        const { db, logService } = createServerServices();
        const results = await Promise.allSettled([
          recordSubscriptionAccess(db, request, request.uid!),
          logService.log({
            level: result === 'failure' ? 'error' : result === 'partial' ? 'warn' : 'info',
            type: 'subscription_access',
            message: result === 'failure' ? '订阅生成失败' : result === 'partial' ? '订阅部分成功' : '订阅生成成功',
            userId: request.uid, requestId,
            meta: { ...meta, ...outcome, result, durationMs },
          }),
        ]);
        if (results.some(item => item.status === 'rejected')) console.error('订阅统计写入失败');
      } catch {
        console.error('订阅观测记录失败');
      }
    });
  } catch {
    console.error('订阅观测任务调度失败');
  }
  return response;
}, { authenticateUser: true });
