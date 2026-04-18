import { getRuntimeEnv } from '@/db';
import { BaseCRUD } from '@/db/base-crud';
import { templates, type Template } from '@/db/schema';
import { ResponseUtils } from '@/utils/responseUtils';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const env = getRuntimeEnv();
  const { templateId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const download = searchParams.get('download');
  const filename = searchParams.get('filename');

  try {
    const crud = new BaseCRUD<Template>(env, templates);
    const template = await crud.selectById(templateId);

    if (!template) {
      return ResponseUtils.error(404, `模板 ${templateId} 不存在`);
    }

    const content = template.content || '';
    const extraHeaders: Record<string, string> = {};

    if (download === 'true' || filename) {
      const finalFilename = filename || `clash-template-${templateId}.yaml`;
      extraHeaders['Content-Disposition'] = `attachment; filename="${finalFilename}"`;
    }

    return ResponseUtils.raw(content, 'text/yaml; charset=utf-8', 200, extraHeaders);
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
