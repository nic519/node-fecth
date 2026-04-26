export type TemplateFormat = 'yaml' | 'visual-v1';

export type PolicyType = 'select' | 'url-test';

export type PolicyTag = 'app' | 'collection' | 'system' | 'region' | 'manual';

export interface VisualTemplateModel {
	version: 1;
	policies: Policy[];
	providerDefaults: RuleProviderDefaults;
	urlTestDefaults: UrlTestDefaults;
}

export interface Policy {
	id: string;
	title: string;
	compileName: string;
	type: PolicyType;
	tags?: PolicyTag[];
	proxies?: PolicyRef[];
	rules?: RuleSetRef[];
	includeAll?: boolean;
	includeAllProxies?: boolean;
	includeAllProviders?: boolean;
	filter?: FilterPreset;
	urlTest?: UrlTestOptions;
}

export interface PolicyRef {
	id: string;
}

export interface RuleSetRef {
	id: string;
	providerKey: string;
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

export interface RuleProviderDefaults {
	type: 'http';
	interval: number;
}

export interface UrlTestDefaults {
	url?: string;
	interval: number;
	tolerance: number;
}

export interface BuiltinPolicy {
	id: string;
	compileName: string;
}

export const BUILTIN_POLICIES: BuiltinPolicy[] = [
	{ id: 'direct', compileName: '🇨🇳 直连' },
	{ id: 'reject', compileName: 'REJECT' },
];
