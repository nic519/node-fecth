import { CustomError, ErrorCode } from './customError';

export class TrafficUtils {
	// 从原始地址获取clash的剩余流量信息
	static async fetchClashContent(clashSubUrl: string): Promise<{ subInfo: string; content: string }> {
		const responseClash = await fetch(clashSubUrl, {
			headers: {
				'User-Agent': 'clash 1.10.0',
			},
		});
		if (!responseClash.ok) {
			throw new CustomError(ErrorCode.SUBSCRIPTION_FETCH_FAILED, 'Failed to fetch subscription content');
		}
		const subInfo = responseClash.headers.get('subscription-userinfo') || '';
		const content = await responseClash.text();
		return { subInfo, content };
	}

	/// 读取远程内容
	static async fetchRawContent(url: string): Promise<string> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new CustomError(ErrorCode.SUBSCRIPTION_FETCH_FAILED, 'Failed to fetch rule content');
		}
		return response.text();
	}
}
