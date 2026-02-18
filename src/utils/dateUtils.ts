
/**
 * Format date to YYYY-MM-DD HH:mm:ss
 * Forces UTC+8 (Beijing Time) for consistency across environments (Cloudflare Workers, etc.)
 */
export function formatDate(date: Date = new Date()): string {
	// 转换到 UTC+8
	// 1. 获取 UTC 时间戳
	// 2. 加上 8 小时的毫秒数 (8 * 60 * 60 * 1000 = 28800000)
	// 3. 使用 getUTC* 方法获取时间分量，确保不受运行环境时区影响
	const beijingTimestamp = date.getTime() + (3600000 * 8);
	const beijingDate = new Date(beijingTimestamp);

	const pad = (n: number) => n.toString().padStart(2, '0');

	const year = beijingDate.getUTCFullYear();
	const month = pad(beijingDate.getUTCMonth() + 1);
	const day = pad(beijingDate.getUTCDate());
	const hours = pad(beijingDate.getUTCHours());
	const minutes = pad(beijingDate.getUTCMinutes());
	const seconds = pad(beijingDate.getUTCSeconds());

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
