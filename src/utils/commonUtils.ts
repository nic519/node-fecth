export class CommonUtils {

	/**
	 * 清理 URL 中的空格和包裹符号
	 * 并根据配置自动处理代理逻辑
	 * @param url 原始 URL
	 * @returns 处理后的 URL
	 */
	static normalizeUrl(url: string): string {
		if (!url) return '';
		// 1. 去除首尾空格
		let cleanUrl = url.trim();
		// 2. 去除首尾的反引号
		cleanUrl = cleanUrl.replace(/^[`'"]+|[`'"]+$/g, '');
		// 3. 再次去除可能的空格
		return cleanUrl.trim();
	}
}
