import { NextResponse } from 'next/server';
import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { safeError } from '@/utils/logHelper';

/**
 * 批量获取本地数据库中已缓存的订阅信息
 * 注意：此接口仅读取数据库，不会发起网络请求更新订阅内容
 * @param urls 订阅链接列表，逗号分隔
 * @returns 数据库中存储的动态内容列表
 */
export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const urls = searchParams.get('urls')?.split(',').filter(Boolean);

        if (urls && urls.length > 0) {
            const results = await DynamicService.getByUrls(urls);
            return NextResponse.json({
                code: 0,
                msg: 'success',
                data: results
            });
        } else {
            return NextResponse.json({ code: 400, msg: 'URLs parameter is required' }, { status: 400 });
        }

    } catch (error: unknown) {
        console.error('Dynamic fetch error:', safeError(error));
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ code: 500, msg: message }, { status: 500 });
    }
};

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
