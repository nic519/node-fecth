import { getDb } from '@/db';
import { templates } from '@/db/schema';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';
import { desc } from 'drizzle-orm';
import { ScTemplateCreateReq } from '@/types/schema.template';
import { ResponseCodes } from '@/types/openapi-schemas';

// GET: 获取模板列表
export const GET = withAuth(async (request) => {
  const env = process.env as unknown as Env;

  try {
    const db = getDb(env);
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
  const env = process.env as unknown as Env;

  try {
    const body = await request.json();
    const validationResult = ScTemplateCreateReq.safeParse(body);
    if (!validationResult.success) {
      return ResponseUtils.error(ResponseCodes.INVALID_PARAMS, validationResult.error.issues[0].message);
    }
    const { name, description, content } = validationResult.data;

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

    return ResponseUtils.success({
      template: newTemplate
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
