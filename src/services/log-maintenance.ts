import type { DbInstance } from '@/server/db';
import { LogService } from './log-service';
import { cleanupSubscriptionAnalytics } from './subscription-analytics';
import { cleanupRegistrationLimits } from './registration-limit';

export async function maintainLogs(db: DbInstance) {
  await new LogService(db).cleanupOldLogs();
  await cleanupSubscriptionAnalytics(db);
  await cleanupRegistrationLimits(db);
  console.info('日志及访问统计过期数据清理完成');
}
