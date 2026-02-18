import { DEFAULT_RULE_URL } from "./constants";

export interface GlobalConfigType {
	isDev: boolean;
	workerUrl: string;
	ruleUrl: string;
	env?: Env;
}

export const GlobalConfig: GlobalConfigType = {
	isDev: false,
	workerUrl: 'https://node.1024.hair',
	ruleUrl: DEFAULT_RULE_URL,
};

