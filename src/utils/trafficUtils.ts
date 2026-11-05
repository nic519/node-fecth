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

export const formatTraffic = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDateTime = (dateStr: string | null): string => {
	if (!dateStr) return '从未';
	if (dateStr.includes('T')) {
		return new Date(dateStr).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
	}
	return dateStr;
};

export const getTrafficBarColor = (usagePercent: number): string => {
	if (usagePercent > 90) return 'bg-red-500';
	if (usagePercent > 70) return 'bg-yellow-500';
	return 'bg-green-500';
};

export function parseTrafficSnapshot(traffic: string | null) {
	const fields = new Map(traffic?.split(';').map((pair) => {
		const [key, value, extra] = pair.split('=');
		return [key.trim().toLowerCase(), extra === undefined ? value?.trim() : undefined] as const;
	}));
	const readInteger = (key: string): number | null => {
		const raw = fields.get(key);
		if (!raw || !/^\d+$/.test(raw)) return null;
		const value = Number(raw);
		return Number.isSafeInteger(value) ? value : null;
	};
	const expiry = readInteger('expire');
	return {
		uploadBytes: readInteger('upload'),
		downloadBytes: readInteger('download'),
		totalBytes: readInteger('total'),
		expiresAtMs: expiry && expiry <= 8_640_000_000_000 ? expiry * 1000 : null,
	};
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
