import { CommonUtils } from '@/utils/commonUtils';

export interface GlobalConfigType {
	isDev: boolean;
	workerUrl: string;
	// 其他全局配置...
}

export const GlobalConfig: GlobalConfigType = {
	isDev: false,
	workerUrl: 'https://node.1024.hair',
	// 其他默认值...
};

export function initGlobalConfig(request: Request) {
	GlobalConfig.isDev = CommonUtils.isLocalEnv(request);
}
