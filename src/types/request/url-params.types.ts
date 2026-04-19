/**
 * 订阅接口查询参数。
 *
 * 表示解析后的订阅 URL 参数。
 */
export interface SubscribeQueryParams {
	// 用户访问订阅接口所需的令牌。
	token: string;
	// 是否以下载方式返回订阅内容。
	download: boolean;
}

/**
 * 订阅接口默认查询参数。
 *
 * token 必须由请求提供，因此默认值中不包含 token。
 */
const DEFAULT_SUBSCRIBE_PARAMS: Omit<Required<SubscribeQueryParams>, 'token'> = {
	download: true,
};

/**
 * 订阅参数解析器。
 *
 * 将 URLSearchParams 转换为内部使用的订阅查询参数结构。
 */
export class SubscribeParamsValidator {
	static parseParams(url: URL): SubscribeQueryParams {
		const token = url.searchParams.get('token');
		if (!token) {
			throw new Error('缺少必要参数: token');
		}

		let shouldDownload = DEFAULT_SUBSCRIBE_PARAMS.download;
		if (url.searchParams.has('download')) {
			shouldDownload = url.searchParams.get('download')?.toLowerCase() === 'true';
		}
		return {
			token,
			download: shouldDownload,
		};
	}
}
