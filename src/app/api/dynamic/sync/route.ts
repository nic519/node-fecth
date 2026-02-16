import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { dynamic } from '@/db/schema';
import { createHash } from 'node:crypto';
import { sql, eq, inArray } from 'drizzle-orm';

export const GET = async (request: Request) => {
    try {
        const { searchParams } = new URL(request.url);
        const urls = searchParams.get('urls')?.split(',').filter(Boolean);

        const db = getDb();
        let query = db.select({
            id: dynamic.id,
            url: dynamic.url,
            traffic: dynamic.traffic,
            updatedAt: dynamic.updatedAt,
        }).from(dynamic);

        if (urls && urls.length > 0) {
            // @ts-ignore
            query = query.where(inArray(dynamic.url, urls));
        }

        const results = await query;

        return NextResponse.json({
            code: 0,
            msg: 'success',
            data: results
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

        // Fetch content
        const response = await fetch(url);
        if (!response.ok) {
            return NextResponse.json({ code: 500, msg: `Failed to fetch URL: ${response.statusText}` }, { status: 500 });
        }

        const content = await response.text();
        const traffic = response.headers.get('Subscription-Userinfo') || null;

        // Calculate MD5 ID
        const id = createHash('md5').update(url).digest('hex');

        // Upsert into DB
        const db = getDb();

        await db.insert(dynamic).values({
            id,
            url,
            content,
            traffic,
        }).onConflictDoUpdate({
            target: dynamic.id,
            set: {
                content,
                traffic,
                updatedAt: sql`(datetime('now'))`,
            },
        });

        return NextResponse.json({
            code: 0,
            msg: 'success',
            data: {
                id,
                url,
                traffic
            }
        });

    } catch (error: any) {
        console.error('Dynamic sync error:', error);
        return NextResponse.json({ code: 500, msg: error.message || 'Internal Server Error' }, { status: 500 });
    }
};
