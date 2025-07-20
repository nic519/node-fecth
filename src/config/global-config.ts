import { CommonUtils } from '@/utils/commonUtils';

export interface GlobalConfigType {
	isDev: boolean;
	workerUrl: string;
	ruleUrl: string;
	env?: Env;
}

export const GlobalConfig: GlobalConfigType = {
	isDev: false,
	workerUrl: 'https://world.1024.hair',
	ruleUrl: 'https://raw.githubusercontent.com/zzy333444/passwall_rule/main/miho-cfg.yaml',
};

export function initGlobalConfig(request: Request, env: Env) {
	GlobalConfig.isDev = CommonUtils.isLocalEnv(request);
	GlobalConfig.env = env;
}
