import { getServerDb } from '@/server/db';
import { templates } from '@/db/schema';
import { ensureTemplateVisualColumns } from '@/db/template-migrations';
import { ResponseUtils } from '@/utils/responseUtils';
import { ConfigTemplateSaveRequestSchema } from '@/types/schema.template';
import { ResponseCodes } from '@/types/api-schemas';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/utils/apiMiddleware';
import { extractVisualModelFromContent, stripVisualModelMetadata } from '@/app/admin/templates/visual-template/metadata';
import { normalizeVisualTemplateModel } from '@/app/admin/templates/visual-template/normalizer';
import type { VisualTemplateModel } from '@/app/admin/templates/visual-template/types';

// PUT: 更新模板
export const PUT = withAuth(async (request, { params }) => {
  const { templateId } = await params;

  try {
    const body = await request.json();
    const validationResult = ConfigTemplateSaveRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, validationResult.error.issues[0].message);
    }

    const { name, description, format = 'yaml' } = validationResult.data;
    const templatePayload = buildTemplatePayload(format, validationResult.data.content, validationResult.data.visualModel);

    const db = getServerDb();
    await ensureTemplateVisualColumns(db);
    const now = new Date().toISOString();

    // 只允许保存经过 schema 校验后的模板字段。
    await db.update(templates)
      .set({
        name,
        description,
        content: templatePayload.content,
        format,
        visualModel: templatePayload.visualModel,
        updatedAt: now
      })
      .where(eq(templates.id, templateId))
      .execute();

    return ResponseUtils.success({
      template: {
        id: templateId,
        name,
        description,
        content: templatePayload.content,
        format,
        visualModel: templatePayload.visualModel,
        updatedAt: now
      }
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });

function buildTemplatePayload(format: 'yaml' | 'visual-v1', rawContent: string, rawVisualModel: unknown) {
	const plainContent = stripVisualModelMetadata(rawContent);
	if (format !== 'visual-v1') {
		return { content: plainContent, visualModel: null };
	}

	return {
		content: plainContent,
		visualModel: getRequestVisualModel(rawVisualModel, rawContent),
	};
}

function getRequestVisualModel(visualModel: unknown, content: string): VisualTemplateModel | null {
	const normalizedModel = normalizeVisualTemplateModel(visualModel);
	if (normalizedModel) return normalizedModel;
	return extractVisualModelFromContent(content);
}

// DELETE: 删除模板
export const DELETE = withAuth(async (_, { params }) => {
  const { templateId } = await params;

  try {
    const db = getServerDb();
    await db.delete(templates).where(eq(templates.id, templateId)).execute();

    return ResponseUtils.success(null);
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
