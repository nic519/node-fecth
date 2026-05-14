import { getServerDb } from '@/server/db';
import { templates } from '@/db/schema';
import { ensureTemplateVisualColumns } from '@/db/template-migrations';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';
import { desc } from 'drizzle-orm';
import { ConfigTemplateSaveRequestSchema } from '@/types/schema.template';
import { ResponseCodes } from '@/types/api-schemas';
import { extractVisualModelFromContent, stripVisualModelMetadata } from '@/app/admin/templates/visual-template/metadata';
import type { VisualTemplateModel } from '@/app/admin/templates/visual-template/types';

// GET: 获取模板列表
export const GET = withAuth(async () => {
  try {
    const db = getServerDb();
    await ensureTemplateVisualColumns(db);
    const result = await db.select().from(templates).orderBy(desc(templates.createdAt)).all();

    return ResponseUtils.success({
      templates: result
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });

// POST: 创建模板
export const POST = withAuth(async (request) => {
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
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newTemplate = {
      id,
      name,
      description: description || '',
      content: templatePayload.content,
      format,
      visualModel: templatePayload.visualModel,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(templates).values(newTemplate).execute();

    return ResponseUtils.success({
      template: newTemplate
    });
  } catch (error: unknown) {
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
	if (isVisualTemplateModel(visualModel)) return visualModel;
	return extractVisualModelFromContent(content);
}

function isVisualTemplateModel(value: unknown): value is VisualTemplateModel {
	return typeof value === 'object' && value !== null && (value as { version?: unknown }).version === 1;
}
