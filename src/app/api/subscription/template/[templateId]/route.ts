import { getServerDb } from '@/server/db';
import { BaseCRUD } from '@/db/base-crud';
import { templates, type Template } from '@/db/schema';
import { ensureTemplateVisualColumns } from '@/db/template-migrations';
import { composeVisualTemplateContent } from '@/app/admin/templates/visual-template/compose';
import { ResponseUtils } from '@/utils/responseUtils';
import { NextRequest } from 'next/server';

// GET: 公开读取指定模板内容，可选择作为附件下载。
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const download = searchParams.get('download');
  const filename = searchParams.get('filename');

  try {
    const db = getServerDb();
    await ensureTemplateVisualColumns(db);
    const crud = new BaseCRUD<Template>(db, templates);
    const template = await crud.selectById(templateId);

    if (!template) {
      return ResponseUtils.error(404, `模板 ${templateId} 不存在`);
    }

    const content = template.format === 'visual-v1'
      ? composeVisualTemplateContent(template.content || '', template.visualModel)
      : template.content || '';
    const extraHeaders: Record<string, string> = {};

    if (download === 'true' || filename) {
      // 传入 filename 或 download=true 时，浏览器会按附件下载模板。
      const finalFilename = filename || `clash-template-${templateId}.yaml`;
      extraHeaders['Content-Disposition'] = `attachment; filename="${finalFilename}"`;
    }

    return ResponseUtils.raw(content, 'text/yaml; charset=utf-8', 200, extraHeaders);
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
