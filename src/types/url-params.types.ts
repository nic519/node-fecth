export interface SubscribeQueryParams {
	token: string;
	download: boolean;
}

const DEFAULT_SUBSCRIBE_PARAMS: Omit<Required<SubscribeQueryParams>, 'token'> = {
	download: true,
};

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
