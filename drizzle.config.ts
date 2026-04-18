import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 加载 .dev.vars 文件中的环境变量
dotenv.config({ path: '.dev.vars' });

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL!,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
	verbose: true,
	strict: true,
});
