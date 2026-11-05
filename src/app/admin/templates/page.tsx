import { AdminTemplatesClient } from './AdminTemplatesClient';
import { getServerDb } from '@/server/db';
import { templates } from '@/db/schema';
import { ensureTemplateVisualColumns } from '@/db/template-migrations';
import { desc } from 'drizzle-orm';
import type { TemplateItem } from './components/TemplateList';
import { requireAdminSession } from '@/server/admin-page';
import { extractVisualModelFromContent, normalizeVisualTemplateContent, stripVisualModelMetadata } from './visual-template/metadata';
import { normalizeVisualTemplateModel } from './visual-template/normalizer';

export default async function AdminTemplatesPage() {
  await requireAdminSession('/admin/templates');

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

  return <AdminTemplatesClient initialTemplates={initialTemplates} />;
}
