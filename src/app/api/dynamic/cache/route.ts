import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { safeError } from '@/utils/logHelper';
import { ResponseUtils } from '@/utils/responseUtils';
import { DynamicCacheRequestSchema, ResponseCodes } from '@/types/openapi-schemas';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const validationResult = DynamicCacheRequestSchema.safeParse(body);
        if (!validationResult.success) {
            return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, 'Invalid request body', validationResult.error.format());
        }

        const { urls } = validationResult.data;
        const results = await DynamicService.getSummaryByUrls(urls);
        return ResponseUtils.success(results, 'success');
    } catch (error: unknown) {
        console.error('Dynamic cache fetch error:', safeError(error));
        return ResponseUtils.handleApiError(error);
    }
};
