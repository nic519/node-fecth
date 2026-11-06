import { z } from 'zod';

import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { CommonUtils } from '@/utils/commonUtils';
import { safeError } from '@/utils/logHelper';
import { ResponseUtils } from '@/utils/responseUtils';
import { ResponseCodes } from '@/types/api-schemas';

const requestSchema = z.object({
	url: z.string().refine((url) => z.url().safeParse(CommonUtils.normalizeUrl(url)).success),
});

// POST: 读取单个订阅源的完整用量序列（按时间升序），用于绘制流量使用曲线。
// 与 /api/dynamic/cache 同级，不触发远程同步。
export const POST = async (request: Request) => {
	try {
		const body = await request.json();
		const validationResult = requestSchema.safeParse(body);

		if (!validationResult.success) {
			return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
		}

		return ResponseUtils.success(await DynamicService.getUsageSeries(validationResult.data.url), 'success');
	} catch (error: unknown) {
		console.error('Dynamic history fetch error:', safeError(error));
		return ResponseUtils.handleApiError(error);
	}
};
