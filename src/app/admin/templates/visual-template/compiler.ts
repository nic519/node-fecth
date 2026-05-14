import yaml from 'js-yaml';
import { normalizeVisualTemplateModel } from './normalizer';
import {
	BUILTIN_PROXY_ALIASES,
	type FilterPreset,
	type Policy,
	type RuleSetRef,
	type VisualTemplateModel,
} from './types';

type ClashConfig = Record<string, unknown>;

const DEFAULT_RULE_PROVIDER = {
	type: 'http',
	interval: 86400,
} as const;

const DEFAULT_URL_TEST = {
	interval: 200,
	tolerance: 23,
} as const;

export function resolveProxyName(name: string, model: VisualTemplateModel): string {
	const normalized = name.trim();
	if (!normalized) throw new Error('Proxy reference cannot be empty');

	const policy = model.policies.find((item) => item.title === normalized);
	if (policy) return policy.title;

	return BUILTIN_PROXY_ALIASES[normalized] ?? normalized;
}

export function compileFilter(filter?: FilterPreset): string | undefined {
	if (!filter) return undefined;
	if (filter.raw?.trim()) return filter.raw.trim();

	const include = normalizeKeywords(filter.include).map(escapeRegexKeyword);
	const exclude = normalizeKeywords(filter.exclude).map(escapeRegexKeyword);
	const includePart = include.length > 0 ? `(?=(${include.join('|')}))` : '';
	const excludePart = exclude.length > 0 ? `(?!.*(${exclude.join('|')}))` : '';
	const value = `${includePart}${excludePart}`;
	return value || undefined;
}

export function compileVisualTemplate(model: VisualTemplateModel): string {
	const normalizedModel = normalizeVisualTemplateModel(model);
	if (!normalizedModel) throw new Error('Visual template model is invalid');

	const proxyGroups = normalizedModel.policies.map((policy) => compilePolicy(policy, normalizedModel));
	const ruleSets = normalizedModel.policies.flatMap((policy) => compileRules(policy));
	const providers = compileRuleProviders(normalizedModel);

	const config: ClashConfig = {
		'proxy-groups': proxyGroups,
		rules: [...ruleSets, 'MATCH,🐟 漏网之鱼'],
		'rule-providers': providers,
	};

	const dumped = yaml.dump(config, {
		lineWidth: -1,
		noRefs: true,
		quotingType: '"',
		flowLevel: 3,
	});

	return normalizeYamlQuoting(dumped);
}

function compilePolicy(policy: Policy, model: VisualTemplateModel): Record<string, unknown> {
	const base: Record<string, unknown> = {
		name: policy.title,
		type: policy.type,
	};

	if (policy.type === 'select' && (policy.proxies ?? []).length > 0) {
		base.proxies = (policy.proxies ?? []).map((proxyName) => resolveProxyName(proxyName, model));
	}

	if (policy.includeAll) base['include-all'] = true;
	if (policy.includeAllProxies) base['include-all-proxies'] = true;
	if (policy.includeAllProviders) base['include-all-providers'] = true;

	const filter = compileFilter(policy.filter);
	if (filter) base.filter = filter;

	if (policy.type === 'url-test') {
		const options = { ...DEFAULT_URL_TEST, ...policy.urlTest };
		if (options.url) base.url = options.url;
		if (options.interval !== undefined) base.interval = options.interval;
		if (options.tolerance !== undefined) base.tolerance = options.tolerance;
		if (options.lazy !== undefined) base.lazy = options.lazy;
		if (options.timeout !== undefined) base.timeout = options.timeout;
		if (options.maxFailedTimes !== undefined) base['max-failed-times'] = options.maxFailedTimes;
		if (options.expectedStatus) base['expected-status'] = options.expectedStatus;
	}

	return base;
}

function compileRules(policy: Policy): string[] {
	return (policy.rules ?? []).map((rule) => {
		const parts = ['RULE-SET', rule.name, policy.title];
		if (rule.noResolve) parts.push('no-resolve');
		return parts.join(',');
	});
}

function compileRuleProviders(model: VisualTemplateModel): Record<string, unknown> {
	const providers: Record<string, unknown> = {};
	const seen = new Set<string>();

	for (const policy of model.policies) {
		for (const rule of policy.rules ?? []) {
			if (seen.has(rule.name)) continue;
			seen.add(rule.name);
			providers[rule.name] = compileProvider(rule);
		}
	}

	return providers;
}

function compileProvider(rule: RuleSetRef): Record<string, unknown> {
	return {
		type: DEFAULT_RULE_PROVIDER.type,
		interval: DEFAULT_RULE_PROVIDER.interval,
		behavior: rule.behavior,
		format: rule.format,
		url: rule.url,
	};
}

function normalizeKeywords(keywords?: string[]): string[] {
	return Array.from(new Set((keywords ?? []).map((keyword) => keyword.trim()).filter(Boolean)));
}

function escapeRegexKeyword(keyword: string): string {
	return keyword.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function normalizeYamlQuoting(content: string): string {
	return content
		.split('\n')
		.map((line) => {
			if (line.includes('proxies: [')) {
				return line.replace(/\[(.*)\]/, (_match, value: string) => {
					const items = value.split(', ').map((item) => {
						const trimmed = item.trim();
						return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed : quoteYamlString(trimmed);
					});
					return `[${items.join(', ')}]`;
				});
			}

			const match = line.match(/^(\s+(?:filter|url): )(.*)$/);
			if (!match || !match[2] || match[2].startsWith('"')) return line;

			return `${match[1]}${quoteYamlString(match[2])}`;
		})
		.join('\n');
}

function quoteYamlString(value: string): string {
	return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
