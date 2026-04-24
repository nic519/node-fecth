import yaml from 'js-yaml';

type ClashTemplateObject = Record<string, unknown>;

type ProxyGroupLike = {
	name?: unknown;
	type?: unknown;
	proxies?: unknown;
	use?: unknown;
	url?: unknown;
	filter?: unknown;
	'exclude-filter'?: unknown;
	'exclude-type'?: unknown;
	tolerance?: unknown;
	interval?: unknown;
	lazy?: unknown;
	timeout?: unknown;
	'max-failed-times'?: unknown;
	'expected-status'?: unknown;
	'disable-udp'?: unknown;
	'include-all'?: unknown;
	'include-all-proxies'?: unknown;
	'include-all-providers'?: unknown;
	hidden?: unknown;
	icon?: unknown;
	strategy?: unknown;
};

export interface ParsedClashTemplate {
	ok: true;
	value: ClashTemplateObject;
	groupNames: string[];
}

export interface FilterPreset {
	groupName: string;
	filter: string;
	includeKeywords: string[];
	excludeKeywords: string[];
	canVisualize: boolean;
}

export interface ProxyGroupSummary {
	name: string;
	type: string;
	includeAll: boolean;
	includeAllProxies: boolean;
	includeAllProviders: boolean;
	disableUdp: boolean;
	hidden: boolean;
	filter: string;
	excludeFilter: string;
	excludeType: string;
	proxyCount: number;
	proxies: string[];
	use: string[];
	url: string;
	tolerance: number | null;
	interval: number | null;
	lazy: boolean | null;
	timeout: number | null;
	maxFailedTimes: number | null;
	expectedStatus: string;
	icon: string;
	strategy: string;
	ruleAssociations: RuleAssociation[];
}

export interface RuleAssociation {
	ruleSet: string;
	providerUrl: string;
}

export interface ClashTemplateError {
	ok: false;
	error: string;
}

export type ParseClashTemplateResult = ParsedClashTemplate | ClashTemplateError;
export type MutationResult = { ok: true; content: string; changed: boolean; message?: string } | ClashTemplateError;
export type ProxyGroupOptionValue = string | number | boolean | null;
export type ProxyGroupOptionKey =
	| 'url'
	| 'interval'
	| 'lazy'
	| 'timeout'
	| 'maxFailedTimes'
	| 'tolerance'
	| 'disableUdp'
	| 'includeAll'
	| 'includeAllProxies'
	| 'includeAllProviders'
	| 'excludeFilter'
	| 'excludeType'
	| 'expectedStatus'
	| 'hidden'
	| 'icon'
	| 'strategy';

export function parseClashTemplate(content: string): ParseClashTemplateResult {
	try {
		const loaded = yaml.load(content) ?? {};
		if (!isRecord(loaded)) {
			return { ok: false, error: 'YAML 根节点必须是对象' };
		}

		const proxyGroups = getProxyGroups(loaded);
		const groupNames = proxyGroups.map((group) => group.name).filter(isNonEmptyString);

		return {
			ok: true,
			value: loaded,
			groupNames,
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, error: `YAML 解析失败：${message}` };
	}
}

export function extractFilterPresets(parsed: ParsedClashTemplate): FilterPreset[] {
	return getProxyGroups(parsed.value)
		.filter((group): group is ProxyGroupLike & { name: string; filter: string } =>
			isNonEmptyString(group.name) && isNonEmptyString(group.filter),
		)
		.map((group) => {
			const parts = parseFilterKeywords(group.filter);
			return {
				groupName: group.name,
				filter: group.filter,
				...parts,
			};
		});
}

export function extractProxyGroupSummaries(parsed: ParsedClashTemplate): ProxyGroupSummary[] {
	const ruleAssociations = extractRuleAssociations(parsed.value);
	return getProxyGroups(parsed.value)
		.filter((group): group is ProxyGroupLike & { name: string } => isNonEmptyString(group.name))
		.map((group) => {
			const proxies = Array.isArray(group.proxies) ? group.proxies.filter(isNonEmptyString) : [];
			const use = Array.isArray(group.use) ? group.use.filter(isNonEmptyString) : [];
			return {
				name: group.name,
				type: isNonEmptyString(group.type) ? group.type : '',
				includeAll: group['include-all'] === true,
				includeAllProxies: group['include-all-proxies'] === true,
				includeAllProviders: group['include-all-providers'] === true,
				disableUdp: group['disable-udp'] === true,
				hidden: group.hidden === true,
				filter: isNonEmptyString(group.filter) ? group.filter : '',
				excludeFilter: isString(group['exclude-filter']) ? group['exclude-filter'] : '',
				excludeType: isString(group['exclude-type']) ? group['exclude-type'] : '',
				proxyCount: proxies.length,
				proxies,
				use,
				url: isString(group.url) ? group.url : '',
				tolerance: toNumberOrNull(group.tolerance),
				interval: toNumberOrNull(group.interval),
				lazy: typeof group.lazy === 'boolean' ? group.lazy : null,
				timeout: toNumberOrNull(group.timeout),
				maxFailedTimes: toNumberOrNull(group['max-failed-times']),
				expectedStatus: isString(group['expected-status']) ? group['expected-status'] : '',
				icon: isString(group.icon) ? group.icon : '',
				strategy: isString(group.strategy) ? group.strategy : '',
				ruleAssociations: ruleAssociations.get(group.name) ?? [],
			};
		});
}

export function applyProxyGroupFilter(content: string, groupName: string, filter: string): MutationResult {
	const parsed = parseClashTemplate(content);
	if (!parsed.ok) return parsed;

	if (!parsed.groupNames.includes(groupName)) {
		return { ok: false, error: `未找到策略组：${groupName}` };
	}

	const patched = patchProxyGroupFilterText(content, groupName, filter.trim());
	if (patched) {
		return { ok: true, content: patched, changed: patched !== content };
	}

	const proxyGroups = getProxyGroups(parsed.value);
	const target = proxyGroups.find((group) => group.name === groupName);
	if (!target) return { ok: false, error: `未找到策略组：${groupName}` };

	if (filter.trim()) target.filter = filter.trim();
	else delete target.filter;

	return dumpMutation(parsed.value, content);
}

export function applyProxyGroupOptions(
	content: string,
	groupName: string,
	options: Partial<Record<ProxyGroupOptionKey, ProxyGroupOptionValue>>,
): MutationResult {
	const parsed = parseClashTemplate(content);
	if (!parsed.ok) return parsed;

	if (!parsed.groupNames.includes(groupName)) {
		return { ok: false, error: `未找到策略组：${groupName}` };
	}

	let nextContent = content;
	for (const [key, value] of Object.entries(options)) {
		if (value === undefined) continue;
		const yamlKey = toProxyGroupYamlKey(key as ProxyGroupOptionKey);
		const patched = patchProxyGroupScalarText(nextContent, groupName, yamlKey, formatProxyGroupOptionValue(value));
		if (patched) nextContent = patched;
	}

	return { ok: true, content: nextContent, changed: nextContent !== content };
}

export function findProxyGroupLineNumber(content: string, groupName: string): number | null {
	const lines = content.split('\n');
	const itemStart = findProxyGroupItemStart(lines, groupName);
	return itemStart === -1 ? null : itemStart + 1;
}

export function buildFilterFromKeywords(options: {
	includeKeywords: string[];
	excludeKeywords: string[];
}): string {
	const include = normalizeKeywordList(options.includeKeywords).map(escapeRegexKeyword);
	const exclude = normalizeKeywordList(options.excludeKeywords).map(escapeRegexKeyword);
	const includePart = include.length > 0 ? `(?=(${include.join('|')}))` : '';
	const excludePart = exclude.length > 0 ? `(?!.*(${exclude.join('|')}))` : '';
	return `${includePart}${excludePart}`;
}

function parseFilterKeywords(filter: string): Omit<FilterPreset, 'groupName' | 'filter'> {
	const includeMatch = filter.match(/\(\?=\(([^)]*)\)\)/) ?? filter.match(/\(\?=\.\*\(\?:([^)]*)\)\)/);
	const excludeMatch = filter.match(/\(\?!\.\*\(([^)]*)\)\)/);
	const inlineExcludeMatches = Array.from(filter.matchAll(/\(\?!\.\*([^().|?+[\]{}\\]+)\.\*\)/g));
	const includeKeywords = splitRegexKeywordGroup(includeMatch?.[1] ?? '');
	const excludeKeywords = [
		...splitRegexKeywordGroup(excludeMatch?.[1] ?? ''),
		...inlineExcludeMatches.map((match) => unescapeRegexKeyword(match[1]?.trim() ?? '')).filter(isNonEmptyString),
	];
	const recognized = includeKeywords.length > 0 || excludeKeywords.length > 0;

	return {
		includeKeywords,
		excludeKeywords: Array.from(new Set(excludeKeywords)),
		canVisualize: recognized,
	};
}

function splitRegexKeywordGroup(value: string): string[] {
	if (!value) return [];
	return value
		.split('|')
		.map((keyword) => unescapeRegexKeyword(keyword.trim()))
		.filter(isNonEmptyString);
}

function normalizeKeywordList(keywords: string[]): string[] {
	return Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(isNonEmptyString)));
}

function escapeRegexKeyword(keyword: string): string {
	return keyword.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function unescapeRegexKeyword(keyword: string): string {
	return keyword.replace(/\\([\\^$.*+?()[\]{}|])/g, '$1');
}

function getProxyGroups(value: ClashTemplateObject): ProxyGroupLike[] {
	return Array.isArray(value['proxy-groups']) ? (value['proxy-groups'] as ProxyGroupLike[]) : [];
}

function extractRuleAssociations(value: ClashTemplateObject): Map<string, RuleAssociation[]> {
	const associations = new Map<string, RuleAssociation[]>();
	const rules = Array.isArray(value.rules) ? value.rules : [];
	const providers = isRecord(value['rule-providers']) ? value['rule-providers'] : {};

	for (const rule of rules) {
		if (!isString(rule)) continue;
		const [type, ruleSet, policy] = rule.split(',').map((part) => part.trim());
		if (type !== 'RULE-SET' || !ruleSet || !policy) continue;
		const provider = providers[ruleSet];
		const providerUrl = isRecord(provider) && isString(provider.url) ? provider.url : '';
		const current = associations.get(policy) ?? [];
		current.push({ ruleSet, providerUrl });
		associations.set(policy, current);
	}

	return associations;
}

function patchProxyGroupFilterText(content: string, groupName: string, filter: string): string | null {
	const lines = content.split('\n');
	const itemStart = findProxyGroupItemStart(lines, groupName);
	if (itemStart === -1) return null;

	const itemEnd = findProxyGroupItemEnd(lines, itemStart);
	const itemText = lines.slice(itemStart, itemEnd).join('\n');
	const quotedFilter = quoteYamlString(filter);

	if (itemText.includes('{')) {
		const nextItem = itemText.replace(/filter:\s*(?:"(?:\\.|[^"])*"|'(?:''|[^'])*'|[^,}\n]*)/, `filter: ${quotedFilter}`);
		if (nextItem !== itemText) {
			return replaceLineRange(lines, itemStart, itemEnd, nextItem);
		}
		const inserted = itemText.replace(/}(\s*,?\s*)$/, `, filter: ${quotedFilter} }$1`);
		return replaceLineRange(lines, itemStart, itemEnd, inserted);
	}

	const filterLineIndex = lines
		.slice(itemStart, itemEnd)
		.findIndex((line) => /^\s*filter\s*:/.test(line));
	const indent = getNestedIndent(lines[itemStart]);

	if (!filter) {
		if (filterLineIndex === -1) return content;
		const nextLines = [...lines];
		nextLines.splice(itemStart + filterLineIndex, 1);
		return nextLines.join('\n');
	}

	if (filterLineIndex !== -1) {
		const nextLines = [...lines];
		nextLines[itemStart + filterLineIndex] = `${indent}filter: ${quotedFilter}`;
		return nextLines.join('\n');
	}

	const nextLines = [...lines];
	nextLines.splice(itemEnd, 0, `${indent}filter: ${quotedFilter}`);
	return nextLines.join('\n');
}

function patchProxyGroupScalarText(content: string, groupName: string, key: string, value: string): string | null {
	const lines = content.split('\n');
	const itemStart = findProxyGroupItemStart(lines, groupName);
	if (itemStart === -1) return null;

	const itemEnd = findProxyGroupItemEnd(lines, itemStart);
	const itemText = lines.slice(itemStart, itemEnd).join('\n');

	if (itemText.includes('{')) {
		const keyPattern = new RegExp(`${escapeRegExp(key)}:\\s*(?:"(?:\\\\.|[^"])*"|'(?:''|[^'])*'|[^,}\\n]*)`);
		const replacement = value ? `${key}: ${value}` : '';
		if (keyPattern.test(itemText)) {
			const nextItem = value
				? itemText.replace(keyPattern, replacement)
				: itemText.replace(new RegExp(`,?\\s*${escapeRegExp(key)}:\\s*(?:"(?:\\\\.|[^"])*"|'(?:''|[^'])*'|[^,}\\n]*)`), '');
			return replaceLineRange(lines, itemStart, itemEnd, nextItem);
		}
		if (!value) return content;
		const inserted = itemText.replace(/}(\s*,?\s*)$/, `, ${key}: ${value} }$1`);
		return replaceLineRange(lines, itemStart, itemEnd, inserted);
	}

	const keyLineIndex = lines
		.slice(itemStart, itemEnd)
		.findIndex((line) => new RegExp(`^\\s*${escapeRegExp(key)}\\s*:`).test(line));
	const indent = getNestedIndent(lines[itemStart]);

	if (!value) {
		if (keyLineIndex === -1) return content;
		const nextLines = [...lines];
		nextLines.splice(itemStart + keyLineIndex, 1);
		return nextLines.join('\n');
	}

	if (keyLineIndex !== -1) {
		const nextLines = [...lines];
		nextLines[itemStart + keyLineIndex] = `${indent}${key}: ${value}`;
		return nextLines.join('\n');
	}

	const nextLines = [...lines];
	nextLines.splice(itemEnd, 0, `${indent}${key}: ${value}`);
	return nextLines.join('\n');
}

function findProxyGroupItemStart(lines: string[], groupName: string): number {
	const proxyGroupsIndex = lines.findIndex((line) => /^\s*proxy-groups\s*:/.test(line));
	if (proxyGroupsIndex === -1) return -1;

	for (let index = proxyGroupsIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (/^\S/.test(line) && !/^\s*-/.test(line)) break;
		if (!/^\s*-/.test(line)) continue;
		const itemEnd = findProxyGroupItemEnd(lines, index);
		const itemText = lines.slice(index, itemEnd).join('\n');
		if (itemText.includes(`name: "${groupName}"`) || itemText.includes(`name: '${groupName}'`) || itemText.includes(`name: ${groupName}`)) {
			return index;
		}
	}

	return -1;
}

function findProxyGroupItemEnd(lines: string[], itemStart: number): number {
	const itemIndent = lines[itemStart].match(/^(\s*)/)?.[1] ?? '';
	for (let index = itemStart + 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (line.trim() === '') continue;
		if (line.startsWith(`${itemIndent}-`)) return index;
		if (/^\S/.test(line)) return index;
	}
	return lines.length;
}

function getNestedIndent(itemStartLine: string): string {
	const itemIndent = itemStartLine.match(/^(\s*)/)?.[1] ?? '';
	return `${itemIndent}  `;
}

function replaceLineRange(lines: string[], start: number, end: number, replacement: string): string {
	const nextLines = [...lines];
	nextLines.splice(start, end - start, ...replacement.split('\n'));
	return nextLines.join('\n');
}

function quoteYamlString(value: string): string {
	return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function formatProxyGroupOptionValue(value: ProxyGroupOptionValue): string {
	if (value === null) return '';
	if (typeof value === 'string') return quoteYamlString(value);
	return String(value);
}

function toProxyGroupYamlKey(key: ProxyGroupOptionKey): string {
	const map: Record<ProxyGroupOptionKey, string> = {
		url: 'url',
		interval: 'interval',
		lazy: 'lazy',
		timeout: 'timeout',
		maxFailedTimes: 'max-failed-times',
		tolerance: 'tolerance',
		disableUdp: 'disable-udp',
		includeAll: 'include-all',
		includeAllProxies: 'include-all-proxies',
		includeAllProviders: 'include-all-providers',
		excludeFilter: 'exclude-filter',
		excludeType: 'exclude-type',
		expectedStatus: 'expected-status',
		hidden: 'hidden',
		icon: 'icon',
		strategy: 'strategy',
	};
	return map[key];
}

function toNumberOrNull(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function dumpMutation(value: ClashTemplateObject, originalContent: string): MutationResult {
	const content = yaml.dump(value, {
		lineWidth: -1,
		noRefs: true,
		quotingType: '"',
	});
	return { ok: true, content, changed: content !== originalContent };
}

function isRecord(value: unknown): value is ClashTemplateObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isString(value: unknown): value is string {
	return typeof value === 'string';
}
