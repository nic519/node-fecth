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