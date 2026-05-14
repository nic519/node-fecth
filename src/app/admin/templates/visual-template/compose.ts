import yaml from 'js-yaml';
import { compileVisualTemplate } from './compiler';
import type { VisualTemplateModel } from './types';

type ClashObject = Record<string, unknown>;

export function composeVisualTemplateContent(content: string, visualModel: VisualTemplateModel | null | undefined): string {
	if (!visualModel) return content;

	const original = parseClashObject(content);
	const visual = parseClashObject(compileVisualTemplate(visualModel));
	const merged: ClashObject = {
		...original,
	};

	const proxyGroups = mergeArrays(original['proxy-groups'], visual['proxy-groups']);
	if (proxyGroups.length > 0) merged['proxy-groups'] = proxyGroups;

	const rules = mergeRules(getStringArray(original.rules), getStringArray(visual.rules));
	if (rules.length > 0) merged.rules = rules;

	const ruleProviders = {
		...(getRecord(original['rule-providers']) ?? {}),
		...(getRecord(visual['rule-providers']) ?? {}),
	};
	if (Object.keys(ruleProviders).length > 0) merged['rule-providers'] = ruleProviders;

	return dumpYaml(removeEmptyTopLevelSections(merged));
}

function mergeArrays(left: unknown, right: unknown): unknown[] {
	return [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])];
}

function mergeRules(originalRules: string[], visualRules: string[]): string[] {
	const originalNonMatch = originalRules.filter((rule) => !isMatchRule(rule));
	const originalMatch = originalRules.find(isMatchRule);
	const visualNonMatch = visualRules.filter((rule) => !isMatchRule(rule));
	const visualMatch = visualRules.find(isMatchRule);
	const fallback = visualMatch ?? originalMatch;

	return [...originalNonMatch, ...visualNonMatch, ...(fallback ? [fallback] : [])];
}

function isMatchRule(rule: string): boolean {
	return rule.trim().toUpperCase().startsWith('MATCH,');
}

function parseClashObject(content: string): ClashObject {
	const loaded = yaml.load(content) ?? {};
	return getRecord(loaded) ?? {};
}

function dumpYaml(value: ClashObject): string {
	return yaml.dump(value, {
		lineWidth: -1,
		noRefs: true,
		quotingType: '"',
	});
}

function removeEmptyTopLevelSections(value: ClashObject): ClashObject {
	return Object.fromEntries(
		Object.entries(value).filter(([, item]) => {
			if (Array.isArray(item)) return item.length > 0;
			if (isRecord(item)) return Object.keys(item).length > 0;
			return item !== undefined && item !== null;
		}),
	);
}

function getStringArray(value: unknown): string[] {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getRecord(value: unknown): ClashObject | null {
	return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is ClashObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
