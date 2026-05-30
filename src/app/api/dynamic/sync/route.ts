import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { safeError } from '@/utils/logHelper';
import { ResponseUtils } from '@/utils/responseUtils';
import { DynamicSyncRequestSchema, ResponseCodes } from '@/types/api-schemas';

/**
 * 触发单个订阅链接的实时同步
 * 注意：此接口会发起真实的网络请求获取最新订阅内容，并更新到数据库
 */
export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const validationResult = DynamicSyncRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
    }

    const { url, proxyProvider } = validationResult.data;
    const result = await DynamicService.fetchAndSave(url, { retries: 3, proxyProvider });

    // 只返回前端需要展示的摘要字段，避免把完整缓存内容带回响应。
    return ResponseUtils.success({
      id: result.id,
      url: result.url,
      traffic: result.traffic,
      updatedAt: result.updatedAt
    }, 'success');
  } catch (error: unknown) {
    console.error('Dynamic sync error:', safeError(error));
    return ResponseUtils.handleApiError(error);
  }
};
