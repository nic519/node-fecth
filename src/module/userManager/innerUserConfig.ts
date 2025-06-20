import { GlobalConfig } from '@/config/global-config';
import { AreaCode, SubConfig, UserConfig } from '@/types/user.types';

// 用户配置类
export class InnerUser {
	readonly subscribe: string;
	readonly accessToken: string;
	readonly ruleUrl: string;
	readonly fileName: string;
	readonly multiPortMode?: AreaCode[];
	readonly appendSubList?: SubConfig[];
	readonly excludeRegex?: string;

	constructor(config: UserConfig) {
		this.subscribe = config.subscribe;
		this.accessToken = config.accessToken;
		this.ruleUrl = config.ruleUrl || GlobalConfig.ruleUrl;
		this.fileName = config.fileName || '';
		this.multiPortMode = config.multiPortMode;
		this.appendSubList = config.appendSubList;
		this.excludeRegex = config.excludeRegex;
	}
}
