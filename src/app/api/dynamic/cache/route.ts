import { NextResponse } from 'next/server';
import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { safeError } from '@/utils/logHelper';

export const POST = async (request: Request) => {
    try {
        const { urls } = await request.json() as { urls?: string[] };
        const validUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];

        if (validUrls.length > 0) {
            const results = await DynamicService.getByUrls(validUrls);
            return NextResponse.json({
                code: 0,
                msg: 'success',
                data: results
            });
        } else {
            return NextResponse.json({ code: 400, msg: 'URLs parameter is required' }, { status: 400 });
        }
    } catch (error: unknown) {
        console.error('Dynamic cache fetch error:', safeError(error));
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ code: 500, msg: message }, { status: 500 });
    }
};

