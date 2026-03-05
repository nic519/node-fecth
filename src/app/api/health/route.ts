import { ResponseUtils } from '@/utils/responseUtils';

export async function GET() {
  return ResponseUtils.success({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.0.0'
  }, 'success');
}
