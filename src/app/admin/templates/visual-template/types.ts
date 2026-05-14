export type TemplateFormat = 'yaml' | 'visual-v1';

export type PolicyType = 'select' | 'url-test';

export interface VisualTemplateModel {
	version: 1;
	policies: Policy[];
}

export interface Policy {
	title: string;
	type: PolicyType;
	proxies?: string[];
	rules?: RuleSetRef[];
	includeAll?: boolean;
	includeAllProxies?: boolean;
	includeAllProviders?: boolean;
	filter?: FilterPreset;
	urlTest?: UrlTestOptions;
}

export interface RuleSetRef {
	name: string;
	behavior: 'domain' | 'ipcidr' | 'classical';
	format: 'mrs' | 'yaml' | 'text';
	url: string;
	noResolve?: boolean;
}

export interface FilterPreset {
	include?: string[];
	exclude?: string[];
	raw?: string;
}

export interface UrlTestOptions {
	url?: string;
	interval?: number;
	tolerance?: number;
	lazy?: boolean;
	timeout?: number;
	maxFailedTimes?: number;
	expectedStatus?: string;
}

export const BUILTIN_PROXY_ALIASES: Record<string, string> = {
	direct: '🇨🇳 直连',
	reject: 'REJECT',
};
