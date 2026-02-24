import { getDb } from '@/db';
import { templates } from '@/db/schema';
import { withAuth } from '@/utils/apiMiddleware';
import { ResponseUtils } from '@/utils/responseUtils';
import { desc } from 'drizzle-orm';

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
    const body = await request.json() as { name: string; description?: string; content: string };
    const { name, description, content } = body;

    if (!name || !content) {
      return ResponseUtils.error(400, 'Missing name or content');
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

    return ResponseUtils.success({
      template: newTemplate
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}, { adminOnly: true });
