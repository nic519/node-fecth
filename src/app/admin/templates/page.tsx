import { AdminTemplatesClient } from './AdminTemplatesClient';
import { getServerDb } from '@/server/db';
import { templates } from '@/db/schema';
import { desc } from 'drizzle-orm';
import type { TemplateItem } from './components/TemplateList';
import { getValidSuperAdminToken } from '@/server/auth';

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ superToken?: string | string[] }>;
}) {
  const params = await searchParams;
  const superToken = getValidSuperAdminToken(params.superToken);
  const templateRows = superToken
    ? await getServerDb().select().from(templates).orderBy(desc(templates.createdAt)).all()
    : [];
  const initialTemplates: TemplateItem[] = templateRows.map((template, index) => ({
    ...template,
    configContent: template.content || '',
    isSelected: index === 0,
  }));

  return <AdminTemplatesClient superToken={superToken ?? ''} initialTemplates={initialTemplates} />;
}
