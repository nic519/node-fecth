import { load } from 'js-yaml';
import type { VisualTemplateModel } from './types';

export interface TemplateValidationInput {
	name: string;
	format?: string;
	// 原始 YAML 片段（visual-v1 可留空或只保留注释）。
	content?: string;
	visualModel?: VisualTemplateModel | null;
}

const isValidHttpUrl = (value: string) => {
	try {
		const url = new URL(value);
		return ['http:', 'https:'].includes(url.protocol);
	} catch {
		return false;
	}
};

/**
 * 模板语义校验。
 *
 * 语法校验由编辑器负责；这里在保存前兜底：名称、YAML 语法、
 * visual-v1 模型的策略名唯一性、过滤正则、规则集与测速参数。
 */
export function validateTemplateSemantics(template: TemplateValidationInput): string[] {
	const errors: string[] = [];

	if (!template.name.trim()) errors.push('模板名称不能为空。');

	// visual-v1 的原始片段可留空；纯注释也视为空文档。
	const content = template.content ?? '';
	const hasYamlContent = content.split(/\r?\n/).some((line) => {
		const text = line.trim();
		return text && text !== '---' && text !== '...' && !text.startsWith('#');
	});
	if (hasYamlContent) {
		try {
			load(content);
		} catch (error) {
			errors.push(`YAML：${error instanceof Error ? error.message : '解析失败'}`);
		}
	}

	if (template.format !== 'visual-v1') return errors;

	const model = template.visualModel;
	if (model?.version !== 1 || !Array.isArray(model.policies)) {
		errors.push('visual-v1 模型必须包含 version: 1 和策略数组。');
		return errors;
	}

	const names = new Set<string>();
	model.policies.forEach((policy, index) => {
		const label = `策略 ${index + 1}`;
		if (!policy.title.trim()) errors.push(`${label} 名称不能为空。`);
		if (names.has(policy.title)) errors.push(`${label} 与其他策略重名。`);
		names.add(policy.title);
		if (!['select', 'url-test'].includes(policy.type)) errors.push(`${label} 类型无效。`);

		if (policy.filter?.raw) {
			try {
				new RegExp(policy.filter.raw);
			} catch {
				errors.push(`${label} 过滤正则无效。`);
			}
		}

		(policy.rules ?? []).forEach((rule, ruleIndex) => {
			if (!rule.name?.trim()) errors.push(`${label} 的规则集 ${ruleIndex + 1} 缺少名称。`);
			if (!isValidHttpUrl(rule.url)) errors.push(`${label} 的规则集 ${ruleIndex + 1} URL 无效。`);
		});

		if (policy.type === 'url-test') {
			if (policy.urlTest?.url && !isValidHttpUrl(policy.urlTest.url)) errors.push(`${label} 测速 URL 无效。`);
			const ranges: Array<[keyof NonNullable<typeof policy.urlTest>, number]> = [
				['interval', 1],
				['timeout', 1],
				['maxFailedTimes', 1],
				['tolerance', 0],
			];
			for (const [key, min] of ranges) {
				const value = policy.urlTest?.[key];
				if (value !== undefined && (!Number.isFinite(value) || (value as number) < min)) {
					errors.push(`${label} 的 ${key} 数值无效。`);
				}
			}
		}
	});

	return errors;
}
