import { getDb } from '@/db';
import { templates } from '@/db/schema';
import { ResponseUtils } from '@/utils/responseUtils';
import { desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET: 获取模板列表
export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb(env);
    const result = await db.select().from(templates).orderBy(desc(templates.createdAt)).all();

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: {
        templates: result
      }
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}

// POST: 创建模板
export async function POST(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { name: string; description?: string; content: string };
    const { name, description, content } = body;

    if (!name || !content) {
      return NextResponse.json({ code: 400, msg: 'Missing name or content' }, { status: 400 });
    }

    const db = getDb(env);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newTemplate = {
      id,
      name,
      description: description || '',
      content,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(templates).values(newTemplate).execute();

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: {
        template: newTemplate
      }
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
