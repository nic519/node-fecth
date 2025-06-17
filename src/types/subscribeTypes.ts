export type SubscribeTarget = 'clash' | 'json';
export type SubscribeMode = 'fast' | 'multiPort';

export interface SubscribeQueryParams {
	mode?: SubscribeMode;
	token: string;
	download: boolean;
}

const DEFAULT_SUBSCRIBE_PARAMS: Omit<Required<SubscribeQueryParams>, 'token'> = {
	mode: 'fast',
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
			mode: (url.searchParams.get('mode') as SubscribeMode) || DEFAULT_SUBSCRIBE_PARAMS.mode,
			download: shouldDownload,
		};
	}
}
