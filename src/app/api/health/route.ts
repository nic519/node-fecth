import { ResponseUtils } from '@/utils/responseUtils';

// GET: 返回服务健康状态，供部署平台或监控探活使用。
export async function GET() {
  return ResponseUtils.success({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0'
  }, 'success');
}
