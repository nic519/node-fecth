
export class CommonUtils {
	/**
	 * 检测是否本地开发模式
	 */
	static isLocalEnv(request: Request): boolean {
		const currentUrl = new URL(request.url);
		return currentUrl.host.startsWith('127.0.0.1') || currentUrl.host.startsWith('localhost');
	}

	/**
	 * 清理 URL 中的空格和包裹符号
	 * @param url 原始 URL
	 * @returns 清理后的 URL
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
