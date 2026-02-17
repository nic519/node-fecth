import { GlobalConfig } from '@/config/global-config';

export class CommonUtils {
	/**
	 * 检测是否本地开发模式
	 */
	static isLocalEnv(request: Request): boolean {
		const currentUrl = new URL(request.url);
		return currentUrl.host.startsWith('127.0.0.1') || currentUrl.host.startsWith('localhost');
	}

	/**
	 * 获取生产worker URI
	 */
	static getProdURI(): string {
		const uri = GlobalConfig.workerUrl;
		if (uri != null) {
			return uri;
		}
		console.warn('⚠️  生产worker URL未配置或转发功能未启用');
		throw new Error('生产worker URL未配置，无法转发操作');
	}
}
