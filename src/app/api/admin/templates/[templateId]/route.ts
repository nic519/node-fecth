import { getDb } from '@/db';
import { templates } from '@/db/schema';
import { ResponseUtils } from '@/utils/responseUtils';
import { ScTemplateCreateReq } from '@/types/schema.template';
import { ResponseCodes } from '@/types/openapi-schemas';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/utils/apiMiddleware';

// PUT: 更新模板
export const PUT = withAuth(async (request, { params }) => {
  const env = process.env as unknown as Env;
  const { templateId } = await params;

  try {
    const body = await request.json();
    const validationResult = ScTemplateCreateReq.safeParse(body);

    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, validationResult.error.issues[0].message);
    }

    const { name, description, content } = validationResult.data;

    const db = getDb(env);
    const now = new Date().toISOString();

    await db.update(templates)
      .set({ name, description, content, updatedAt: now })
      .where(eq(templates.id, templateId))
      .execute();

    return ResponseUtils.success({
      template: {
        id: templateId,
        name,
        description,
        content,
        updatedAt: now
      }
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });

// DELETE: 删除模板
export const DELETE = withAuth(async (_, { params }) => {
  const env = process.env as unknown as Env;
  const { templateId } = await params;

  try {
    const db = getDb(env);
    await db.delete(templates).where(eq(templates.id, templateId)).execute();

    return ResponseUtils.success(null);
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
