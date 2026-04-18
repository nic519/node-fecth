import 'dotenv/config';

import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';

import { users } from '@/db/schema';
import { mergeLegacySubscribeIntoAppendSubList } from '@/modules/user/legacy-subscription-migration';

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not configured');
  }

  const client = createClient({ url, authToken });
  return drizzle(client, { schema: { users } });
}

async function main() {
  const db = createDb();
  const allUsers = await db
    .select({
      id: users.id,
      config: users.config,
      appendSubList: users.appendSubList,
    })
    .from(users)
    .all();

  let migratedCount = 0;
  let unchangedCount = 0;

  for (const user of allUsers) {
    const mergedSubscriptions = mergeLegacySubscribeIntoAppendSubList({
      config: user.config,
      appendSubList: user.appendSubList,
    });
    const nextAppendSubList = mergedSubscriptions.length > 0 ? JSON.stringify(mergedSubscriptions) : '';

    if ((user.appendSubList || '') === nextAppendSubList) {
      unchangedCount += 1;
      continue;
    }

    await db
      .update(users)
      .set({
        appendSubList: nextAppendSubList,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id))
      .execute();

    migratedCount += 1;
    console.log(`Migrated user ${user.id}`);
  }

  console.log(`Migration finished. migrated=${migratedCount}, unchanged=${unchangedCount}, total=${allUsers.length}`);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
