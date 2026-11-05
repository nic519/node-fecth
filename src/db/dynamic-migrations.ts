import type { DbInstance } from '@/server/db';

const initializations = new WeakMap<DbInstance, Promise<void>>();

export function ensureDynamicHistoryTable(db: DbInstance): Promise<void> {
	const existing = initializations.get(db);
	if (existing) return existing;

	const initialization = migrateDynamicHistory(db).catch((error: unknown) => {
		initializations.delete(db);
		throw error;
	});
	initializations.set(db, initialization);
	return initialization;
}

async function migrateDynamicHistory(db: DbInstance): Promise<void> {
	const tx = await db.$client.transaction('write');
	try {
		await tx.execute(`CREATE TABLE IF NOT EXISTS dynamic_history (
			id INTEGER PRIMARY KEY,
			dynamic_id TEXT NOT NULL,
			traffic TEXT,
			updated_at TEXT NOT NULL
		)`);
		const { rows } = await tx.execute('PRAGMA table_info(dynamic_history)');
		const existingColumns = new Set(rows.map((row) => row.name));
		const newColumns = ['fetched_at_ms', 'upload_bytes', 'download_bytes', 'total_bytes', 'expires_at_ms'];
		const missingColumns = newColumns.filter((name) => !existingColumns.has(name));

		await tx.batch([
			...missingColumns.map((name) => `ALTER TABLE dynamic_history ADD COLUMN ${name} INTEGER`),
			`CREATE INDEX IF NOT EXISTS dynamic_history_source_fetched_idx
				ON dynamic_history (dynamic_id, fetched_at_ms, id)`,
			`INSERT INTO dynamic_history (dynamic_id, traffic, updated_at)
				SELECT dynamic.id, dynamic.traffic, dynamic.updated_at
				FROM dynamic
				WHERE NOT EXISTS (
					SELECT 1 FROM dynamic_history WHERE dynamic_history.dynamic_id = dynamic.id
				)`,
			`UPDATE dynamic_history SET fetched_at_ms = CAST(ROUND((julianday(
				CASE WHEN updated_at GLOB '????-??-?? ??:??:??' THEN updated_at || '+08:00'
					ELSE updated_at END
			) - 2440587.5) * 86400000) AS INTEGER)
			WHERE fetched_at_ms IS NULL`,
		]);
		await tx.commit();
	} finally {
		tx.close();
	}
}
