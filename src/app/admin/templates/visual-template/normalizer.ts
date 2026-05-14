import type { FilterPreset, Policy, RuleSetRef, UrlTestOptions, VisualTemplateModel } from './types';

type UnknownRecord = Record<string, unknown>;

export function normalizeVisualTemplateModel(value: unknown): VisualTemplateModel | null {
	if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.policies)) return null;

	const nameById = buildPolicyNameIndex(value.policies);
	const policies = value.policies
		.map((policy) => normalizePolicy(policy, nameById))
		.filter((policy): policy is Policy => policy !== null);

	return {
		version: 1,
		policies,
	};
}

function buildPolicyNameIndex(policies: unknown[]): Map<string, string> {
	const index = new Map<string, string>();

	for (const policy of policies) {
		if (!isRecord(policy)) continue;
		const id = readString(policy.id);
		const name = firstString(policy, ['title', 'compileName', 'name', 'id']);
		if (id && name) index.set(id, name);
	}

	return index;
}

function normalizePolicy(value: unknown, nameById: Map<string, string>): Policy | null {
	if (!isRecord(value)) return null;

	const title = firstString(value, ['title', 'compileName', 'name', 'id']);
	const type = normalizePolicyType(value.type);
	if (!title || !type) return null;

	const policy: Policy = {
		title,
		type,
	};

	const proxies = normalizeProxyRefs(value.proxies, nameById);
	if (proxies.length > 0) policy.proxies = proxies;

	const rules = normalizeRules(value.rules);
	if (rules.length > 0) policy.rules = rules;

	if (value.includeAll === true) policy.includeAll = true;
	if (value.includeAllProxies === true) policy.includeAllProxies = true;
	if (value.includeAllProviders === true) policy.includeAllProviders = true;

	const filter = normalizeFilter(value.filter);
	if (filter) policy.filter = filter;

	const urlTest = normalizeUrlTest(value.urlTest);
	if (urlTest) policy.urlTest = urlTest;

	return policy;
}

function normalizePolicyType(value: unknown): Policy['type'] | null {
	return value === 'select' || value === 'url-test' ? value : null;
}

function normalizeProxyRefs(value: unknown, nameById: Map<string, string>): string[] {
	if (!Array.isArray(value)) return [];

	return uniqueNonEmpty(value.map((item) => normalizeProxyRef(item, nameById)));
}

function normalizeProxyRef(value: unknown, nameById: Map<string, string>): string | null {
	if (typeof value === 'string') return value;
	if (!isRecord(value)) return null;

	const id = readString(value.id);
	if (id && nameById.has(id)) return nameById.get(id) ?? null;

	return firstString(value, ['title', 'compileName', 'name', 'id']);
}

function normalizeRules(value: unknown): RuleSetRef[] {
	if (!Array.isArray(value)) return [];

	return value
		.map((rule) => {
			if (!isRecord(rule)) return null;
			const name = firstString(rule, ['name', 'providerKey', 'id']);
			const url = readString(rule.url);
			if (!name || url === null) return null;

			return {
				name,
				behavior: normalizeRuleBehavior(rule.behavior),
				format: normalizeRuleFormat(rule.format),
				url,
				...(rule.noResolve === true ? { noResolve: true } : {}),
			};
		})
		.filter((rule): rule is RuleSetRef => rule !== null);
}

function normalizeRuleBehavior(value: unknown): RuleSetRef['behavior'] {
	return value === 'domain' || value === 'ipcidr' || value === 'classical' ? value : 'domain';
}

function normalizeRuleFormat(value: unknown): RuleSetRef['format'] {
	return value === 'mrs' || value === 'yaml' || value === 'text' ? value : 'mrs';
}

function normalizeFilter(value: unknown): FilterPreset | undefined {
	if (!isRecord(value)) return undefined;

	const include = normalizeStringArray(value.include);
	const exclude = normalizeStringArray(value.exclude);
	const raw = readString(value.raw)?.trim();
	const filter: FilterPreset = {};

	if (include.length > 0) filter.include = include;
	if (exclude.length > 0) filter.exclude = exclude;
	if (raw) filter.raw = raw;

	return Object.keys(filter).length > 0 ? filter : undefined;
}

function normalizeUrlTest(value: unknown): UrlTestOptions | undefined {
	if (!isRecord(value)) return undefined;

	const urlTest: UrlTestOptions = {};
	const url = readString(value.url)?.trim();
	const expectedStatus = readString(value.expectedStatus)?.trim();

	if (url) urlTest.url = url;
	setOptionalNumber(urlTest, 'interval', value.interval);
	setOptionalNumber(urlTest, 'tolerance', value.tolerance);
	setOptionalNumber(urlTest, 'timeout', value.timeout);
	setOptionalNumber(urlTest, 'maxFailedTimes', value.maxFailedTimes);
	if (value.lazy === true) urlTest.lazy = true;
	if (expectedStatus) urlTest.expectedStatus = expectedStatus;

	return Object.keys(urlTest).length > 0 ? urlTest : undefined;
}

function setOptionalNumber<T extends 'interval' | 'tolerance' | 'timeout' | 'maxFailedTimes'>(
	target: UrlTestOptions,
	key: T,
	value: unknown,
) {
	const numberValue = normalizeNumber(value);
	if (numberValue !== null) target[key] = numberValue;
}

function normalizeNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value !== 'string' || !value.trim()) return null;

	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStringArray(value: unknown): string[] {
	return Array.isArray(value) ? uniqueNonEmpty(value.map((item) => (typeof item === 'string' ? item : null))) : [];
}

function uniqueNonEmpty(values: Array<string | null>): string[] {
	return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function firstString(record: UnknownRecord, keys: string[]): string | null {
	for (const key of keys) {
		const value = readString(record[key]);
		if (value) return value;
	}

	return null;
}

function readString(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
