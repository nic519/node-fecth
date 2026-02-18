import { NextResponse } from 'next/server';
import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { safeError } from '@/utils/logHelper';

/**
 * 触发单个订阅链接的实时同步
 * 注意：此接口会发起真实的网络请求获取最新订阅内容，并更新到数据库
 * @param url 需要同步的订阅链接
 * @returns 更新后的订阅信息
 */
export const POST = async (request: Request) => {
    try {
        const { url } = await request.json() as { url: string };

        if (!url) {
            return NextResponse.json({ code: 400, msg: 'URL is required' }, { status: 400 });
        }

        const result = await DynamicService.fetchAndSave(url);

        return NextResponse.json({
            code: 0,
            msg: 'success',
            data: result
        });

    } catch (error: unknown) {
        console.error('Dynamic sync error:', safeError(error));
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ code: 500, msg: message }, { status: 500 });
    }
};
