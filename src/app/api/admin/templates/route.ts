import { LogService } from '@/services/log-service';
import { getServerDb } from '@/server/db';
import { templates } from '@/db/schema';
import { ensureTemplateVisualColumns } from '@/db/template-migrations';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';
import { desc } from 'drizzle-orm';
import { ConfigTemplateSaveRequestSchema } from '@/types/schema.template';
import { ResponseCodes } from '@/types/api-schemas';
import { extractVisualModelFromContent, stripVisualModelMetadata } from '@/app/admin/templates/visual-template/metadata';
import { normalizeVisualTemplateModel } from '@/app/admin/templates/visual-template/normalizer';
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
  let logger: LogService | undefined;
  try {
    const db = getServerDb();
    logger = new LogService(db);
    const body = await request.json();
    const validationResult = ConfigTemplateSaveRequestSchema.safeParse(body);

    if (!validationResult.success) {
      logger.record({ level: 'audit', type: 'template_create', message: '模板创建校验失败', meta: { actorId: 'admin', result: 'rejected' } });
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, validationResult.error.issues[0].message);
    }

    const { name, description, format = 'yaml' } = validationResult.data;
    const templatePayload = buildTemplatePayload(format, validationResult.data.content, validationResult.data.visualModel);

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

    logger.record({ level: 'audit', type: 'template_create', message: '管理员创建模板', meta: { actorId: 'admin', targetId: id, result: 'success' } });

    return ResponseUtils.success({
      template: newTemplate
    });
  } catch (error: unknown) {
    logger?.record({ level: 'audit', type: 'template_create', message: '模板创建失败', meta: { actorId: 'admin', result: 'failed' } });
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
