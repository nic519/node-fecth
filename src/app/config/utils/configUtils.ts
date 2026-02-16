
/**
 * 格式化时间
 */
export function formatTime(date: Date): string {
	return date.toLocaleString('zh-CN', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		console.error('复制失败:', err);
		return false;
	}
}
