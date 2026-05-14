import { sql } from 'drizzle-orm';
import type { DbInstance } from '@/server/db';

let templateVisualColumnsReady = false;

export async function ensureTemplateVisualColumns(db: DbInstance): Promise<void> {
	if (templateVisualColumnsReady) return;

	const existingColumns = await getTemplateColumns(db);
	if (!existingColumns.has('format')) {
		await db.run(sql`ALTER TABLE templates ADD COLUMN format text DEFAULT 'yaml'`);
	}
	if (!existingColumns.has('visual_model')) {
		await db.run(sql`ALTER TABLE templates ADD COLUMN visual_model text`);
	}
	templateVisualColumnsReady = true;
}

async function getTemplateColumns(db: DbInstance): Promise<Set<string>> {
	const rows = await db.all<{ name: string }>(sql`PRAGMA table_info(templates)`);
	return new Set(rows.map((row) => row.name));
}
