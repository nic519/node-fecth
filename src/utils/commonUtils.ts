
export class CommonUtils {
	/**
	 * 检测是否本地开发模式
	 */
	static isLocalEnv(request: Request): boolean {
		const currentUrl = new URL(request.url);
		return currentUrl.host.startsWith('127.0.0.1') || currentUrl.host.startsWith('localhost');
	}
}
