/**
 * 用户管理相关的工具函数
 */

/**
 * 格式化流量数据
 * @param bytes 字节数
 * @returns 格式化后的流量字符串
 */
export const formatTraffic = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期时间
 * @param dateStr 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateStr: string | null): string => {
	if (!dateStr) return '从未';
	return new Date(dateStr).toLocaleString('zh-CN');
};

/**
 * 获取流量使用率对应的进度条颜色
 * @param usagePercent 使用率百分比
 * @returns CSS 类名字符串
 */
export const getTrafficBarColor = (usagePercent: number): string => {
	if (usagePercent > 90) return 'bg-red-500';
	if (usagePercent > 70) return 'bg-yellow-500';
	return 'bg-green-500';
};

export interface ParsedTrafficInfo {
	upload: number;
	download: number;
	total: number;
	used: number;
	remaining: number;
	expire?: number;
	isExpired: boolean;
	usagePercent: number;
}

export const parseTrafficInfo = (traffic: string | null | undefined): ParsedTrafficInfo | null => {
	if (!traffic) return null;

	const info: Record<string, number> = {};

	traffic.split(';').forEach((pair) => {
		const [key, value] = pair.trim().split('=');
		if (key && value) {
			const num = Number(value);
			if (!Number.isNaN(num)) {
				info[key] = num;
			}
		}
	});

	const upload = info.upload || 0;
	const download = info.download || 0;
	const total = info.total || 0;
	const used = upload + download;
	const remaining = Math.max(0, total - used);
	const usagePercent = total > 0 ? Math.round((used / total) * 10000) / 100 : 0;
	const expire = info.expire;
	const isExpired = expire ? expire * 1000 < Date.now() : false;

	return {
		upload,
		download,
		total,
		used,
		remaining,
		expire,
		isExpired,
		usagePercent,
	};
};
