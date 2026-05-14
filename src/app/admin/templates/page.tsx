import { AdminTemplatesClient } from './AdminTemplatesClient';
import { getServerDb } from '@/server/db';
import { templates } from '@/db/schema';
import { ensureTemplateVisualColumns } from '@/db/template-migrations';
import { desc } from 'drizzle-orm';
import type { TemplateItem } from './components/TemplateList';
import { getValidSuperAdminToken } from '@/server/auth';
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied';
import { extractVisualModelFromContent, normalizeVisualTemplateContent, stripVisualModelMetadata } from './visual-template/metadata';
import { normalizeVisualTemplateModel } from './visual-template/normalizer';

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);

  if (!superToken) {
    return <AdminAccessDenied />;
  }

  const db = getServerDb();
  await ensureTemplateVisualColumns(db);
  const templateRows = await db.select().from(templates).orderBy(desc(templates.createdAt)).all();
  const initialTemplates: TemplateItem[] = templateRows.map((template, index) => {
    const legacyVisualModel = extractVisualModelFromContent(template.content || '');
    const visualModel = normalizeVisualTemplateModel(template.visualModel) ?? legacyVisualModel;
    const content = visualModel || template.format === 'visual-v1'
      ? stripVisualModelMetadata(template.content || '')
      : normalizeVisualTemplateContent(template.content || '');
    return {
      ...template,
      visualModel,
      format: template.format === 'visual-v1' || visualModel ? 'visual-v1' : 'yaml',
      content,
      configContent: content,
      isSelected: index === 0,
    };
  });

  return <AdminTemplatesClient superToken={superToken} initialTemplates={initialTemplates} />;
}
