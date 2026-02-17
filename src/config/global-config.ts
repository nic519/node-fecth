import { CommonUtils } from '@/utils/commonUtils';

export interface GlobalConfigType {
	isDev: boolean;
	workerUrl: string;
	ruleUrl: string;
	env?: Env;
}

export const GlobalConfig: GlobalConfigType = {
	isDev: false,
	workerUrl: 'https://node.1024.hair',
	ruleUrl: 'https://node.1024.hair/api/subscription/template/1759313797591',
};

