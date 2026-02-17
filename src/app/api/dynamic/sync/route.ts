import { NextResponse } from 'next/server';
import { DynamicService } from '@/modules/dynamic/dynamic.service';

/// 获取订阅链接的动态内容
/// @param urls 订阅链接列表，逗号分隔
/// @returns 动态内容列表
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

        return NextResponse.json({
            code: 0,
            msg: 'success',
            data: [] // Placeholder, see below
        });

    } catch (error: any) {
        console.error('Dynamic fetch error:', error);
        return NextResponse.json({ code: 500, msg: error.message || 'Internal Server Error' }, { status: 500 });
    }
};

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

    } catch (error: any) {
        console.error('Dynamic sync error:', error);
        return NextResponse.json({ code: 500, msg: error.message || 'Internal Server Error' }, { status: 500 });
    }
};
