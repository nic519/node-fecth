import { formatDate } from './dateUtils';

/**
 * 模板等列表场景的极简相对时间工具。
 *
 * 数据库里 templates 的 created_at/updated_at 有两种来源：
 * - SQLite `datetime('now')` 默认值："YYYY-MM-DD HH:MM:SS"（UTC、无时区标记）
 * - 路由里 `new Date().toISOString()`："YYYY-MM-DDTHH:MM:SS.sssZ"
 * 两者都是 UTC 时刻，解析时统一还原成同一时间戳后再计算。
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// 兼容 SQLite 默认值的 "YYYY-MM-DD HH:MM(:SS)" 形态（秒可省略）
const SQLITE_UTC_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}(:\d{2})?(:\d{2})?$/;

/** 把两种存储格式解析成 UTC 时间戳；无法识别时返回 null。 */
export function parseTemplateTime(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const normalized = SQLITE_UTC_PATTERN.test(trimmed)
		? `${trimmed.replace(' ', 'T')}Z`
		: trimmed;
	const time = new Date(normalized).getTime();
	return Number.isNaN(time) ? null : time;
}

/**
 * 极简相对时间：< 1 分钟显示“刚刚”，1 小时内显示“20min”，
 * 1 天内显示“5h”，更早显示“3d”。未来时间（时钟偏差）按“刚刚”处理。
 */
export function formatRelativeTime(value: string | null, now: Date = new Date()): string {
	if (!value) return '-';
	const time = parseTemplateTime(value);
	if (time == null) return '-';

	const elapsed = now.getTime() - time;
	if (elapsed < HOUR_MS) {
		const minutes = Math.floor(elapsed / MINUTE_MS);
		return minutes < 1 ? '刚刚' : `${minutes}min`;
	}
	if (elapsed < DAY_MS) {
		return `${Math.floor(elapsed / HOUR_MS)}h`;
	}
	return `${Math.floor(elapsed / DAY_MS)}d`;
}

/**
 * 完整时间戳（悬浮提示用）：统一显示为北京时间 “YYYY-MM-DD HH:mm”。
 * 无法解析时原样返回，保持兜底可读。
 */
export function formatTimestampCN(value: string | null): string {
	if (!value) return '-';
	const time = parseTemplateTime(value);
	if (time == null) return value.trim();
	return formatDate(new Date(time)).slice(0, 16);
}
