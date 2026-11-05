import worker from './.open-next/worker.js';

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js';

const scheduledWorker = {
  fetch: worker.fetch,
  scheduled(_controller, env, ctx) {
    ctx.waitUntil((async () => {
      const token = env.CRON_SECRET || env.SUPER_ADMIN_TOKEN;
      if (!token) throw new Error('定时清理缺少管理员凭据');
      const response = await worker.fetch(new Request('https://maintenance.internal/api/internal/log-maintenance', {
        method: 'POST', headers: { authorization: `Bearer ${token}` },
      }), env, ctx);
      if (!response.ok) throw new Error(`定时清理失败 (${response.status})`);
    })());
  },
};

export default scheduledWorker;
