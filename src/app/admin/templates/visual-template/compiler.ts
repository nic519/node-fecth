import yaml from 'js-yaml';
import {
	BUILTIN_POLICIES,
	type FilterPreset,
	type Policy,
	type PolicyRef,
	type RuleSetRef,
	type VisualTemplateModel,
} from './types';

type ClashConfig = Record<string, unknown>;

export function resolvePolicyCompileName(ref: PolicyRef, model: VisualTemplateModel): string {
	const policy = model.policies.find((item) => item.id === ref.id);
	if (policy) return policy.compileName;

	const builtin = BUILTIN_POLICIES.find((item) => item.id === ref.id);
	if (builtin) return builtin.compileName;

	throw new Error(`Unknown policy reference: ${ref.id}`);
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
	const proxyGroups = model.policies.map((policy) => compilePolicy(policy, model));
	const ruleSets = model.policies.flatMap((policy) => compileRules(policy));
	const providers = compileRuleProviders(model);

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
		name: policy.compileName,
		type: policy.type,
	};

	if (policy.type === 'select') {
		base.proxies = (policy.proxies ?? []).map((ref) => resolvePolicyCompileName(ref, model));
	}

	if (policy.includeAll) base['include-all'] = true;
	if (policy.includeAllProxies) base['include-all-proxies'] = true;
	if (policy.includeAllProviders) base['include-all-providers'] = true;

	const filter = compileFilter(policy.filter);
	if (filter) base.filter = filter;

	if (policy.type === 'url-test') {
		const options = { ...model.urlTestDefaults, ...policy.urlTest };
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
		const parts = ['RULE-SET', rule.providerKey, policy.compileName];
		if (rule.noResolve) parts.push('no-resolve');
		return parts.join(',');
	});
}

function compileRuleProviders(model: VisualTemplateModel): Record<string, unknown> {
	const providers: Record<string, unknown> = {};
	const seen = new Set<string>();

	for (const policy of model.policies) {
		for (const rule of policy.rules ?? []) {
			if (seen.has(rule.providerKey)) continue;
			seen.add(rule.providerKey);
			providers[rule.providerKey] = compileProvider(rule, model);
		}
	}

	return providers;
}

function compileProvider(rule: RuleSetRef, model: VisualTemplateModel): Record<string, unknown> {
	return {
		type: model.providerDefaults.type,
		interval: model.providerDefaults.interval,
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
