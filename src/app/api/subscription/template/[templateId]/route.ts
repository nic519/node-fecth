import { NextRequest, NextResponse } from 'next/server';
import { BaseCRUD } from '@/db/base-crud';
import { templates, type Template } from '@/db/schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { env } = getRequestContext<Env & Record<string, unknown>>();
  const { templateId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const download = searchParams.get('download');
  const filename = searchParams.get('filename');

  try {
    const crud = new BaseCRUD<Template>(env as unknown as Env, templates);
    const template = await crud.selectById(templateId);

    if (!template) {
      return NextResponse.json({
        error: 'Template not found',
        message: `模板 ${templateId} 不存在`,
        code: 'TEMPLATE_NOT_FOUND',
      }, { status: 404 });
    }

    const content = template.content || '';

    const headers = new Headers();
    headers.set('Content-Type', 'text/yaml; charset=utf-8');

    if (download === 'true' || filename) {
      const finalFilename = filename || `clash-template-${templateId}.yaml`;
      headers.set('Content-Disposition', `attachment; filename="${finalFilename}"`);
    }

    return new NextResponse(content, { headers });
  } catch {
    return NextResponse.json({
      error: 'Internal Server Error',
      message: '获取模板失败，请稍后重试',
      code: 'TEMPLATE_FETCH_ERROR',
    }, { status: 500 });
  }
}
