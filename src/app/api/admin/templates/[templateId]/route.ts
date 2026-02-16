import { getDb } from '@/db';
import { templates } from '@/db/schema';
import { ResponseUtils } from '@/utils/responseUtils';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// PUT: 更新模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const env = process.env as unknown as Env;
  const { templateId } = await params;
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
    const now = new Date().toISOString();

    await db.update(templates)
      .set({ name, description, content, updatedAt: now })
      .where(eq(templates.id, templateId))
      .execute();

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: { id: templateId, name, description, content, updatedAt: now }
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}

// DELETE: 删除模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const env = process.env as unknown as Env;
  const { templateId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb(env);
    await db.delete(templates).where(eq(templates.id, templateId)).execute();

    return NextResponse.json({
      code: 0,
      msg: 'success'
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
