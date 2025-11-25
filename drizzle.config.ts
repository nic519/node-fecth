import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit 配置 - 推荐方案
 *
 * 最佳实践：
 * 1. 本地开发：使用独立的稳定 SQLite 文件
 * 2. 生产环境：使用 Cloudflare D1 HTTP API
 * 3. Drizzle Studio 连接独立文件，不依赖 Wrangler 运行时
 */

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',

	...(isProduction
		? {
				// 生产环境：使用 D1 HTTP API
				driver: 'd1-http' as const,
				dbCredentials: {
					accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
					databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
					token: process.env.CLOUDFLARE_D1_TOKEN!,
				},
		  }
		: {
				// 开发环境：使用独立的本地文件（不依赖 Wrangler）
				dbCredentials: {
					url: './local.db',
				},
		  }),

	verbose: true,
	strict: true,
});
