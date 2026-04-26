import { expect, test } from 'bun:test';
import yaml from 'js-yaml';
import { compileFilter, compileVisualTemplate, resolvePolicyCompileName } from '@/app/admin/templates/visual-template/compiler';
import { minimalVisualTemplateModel } from '@/app/admin/templates/visual-template/fixtures';
import {
	extractVisualModelFromContent,
	normalizeVisualTemplateContent,
	wrapVisualModelContent,
} from '@/app/admin/templates/visual-template/metadata';

test('compileFilter creates include and exclude regex', () => {
	expect(compileFilter({ include: ['港', 'HK'], exclude: ['1.5', '倍率:2'] })).toBe('(?=(港|HK))(?!.*(1\\.5|倍率:2))');
});

test('resolvePolicyCompileName resolves user and builtin policies', () => {
	expect(resolvePolicyCompileName({ id: 'auto-hk' }, minimalVisualTemplateModel)).toBe('[自动]-香港🇭🇰');
	expect(resolvePolicyCompileName({ id: 'direct' }, minimalVisualTemplateModel)).toBe('🇨🇳 直连');
});

test('compileVisualTemplate emits proxy-groups, rules, and providers', () => {
	const yaml = compileVisualTemplate(minimalVisualTemplateModel);

	expect(yaml).toContain('proxy-groups:');
	expect(yaml).toContain('name: "[自动]-香港🇭🇰"');
	expect(yaml).toContain('type: url-test');
	expect(yaml).toContain('filter: "(?=(港|HK|Hong|🇭🇰))(?!.*(1\\\\.5|倍率:2))"');
	expect(yaml).toContain('name: "[单]-WhatsApp💬"');
	expect(yaml).toContain('proxies: ["🚀 国外流量", "🇨🇳 直连"]');
	expect(yaml).toContain('RULE-SET,whatsapp_domain,[单]-WhatsApp💬');
	expect(yaml).toContain('rule-providers:');
	expect(yaml).toContain('whatsapp_domain:');
	expect(yaml).toContain('url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/whatsapp.mrs"');
});

test('wrapVisualModelContent stores model and compiled yaml in one content string', () => {
	const content = wrapVisualModelContent(minimalVisualTemplateModel);
	const extracted = extractVisualModelFromContent(content);

	expect(content).toContain('# visual-v1:model:');
	expect(content).toContain('proxy-groups:');
	expect(extracted?.version).toBe(1);
	expect(extracted?.policies.find((policy) => policy.id === 'whatsapp')?.compileName).toBe('[单]-WhatsApp💬');
});

test('wrapVisualModelContent keeps the generated content valid YAML', () => {
	const content = wrapVisualModelContent(minimalVisualTemplateModel);
	const parsed = yaml.load(content);

	expect(parsed).toMatchObject({
		'proxy-groups': expect.any(Array),
		rules: expect.any(Array),
		'rule-providers': expect.any(Object),
	});
});

test('normalizeVisualTemplateContent repairs legacy visual metadata body lines', () => {
	const content = wrapVisualModelContent(minimalVisualTemplateModel);
	const encoded = content.match(/^# visual-v1:model:(.+)$/m)?.[1];
	expect(encoded).toBeTruthy();

	const legacyContent = content.replace(`# visual-v1:model:${encoded}`, `# visual-v1:model:\n${encoded}`);
	expect(() => yaml.load(legacyContent)).toThrow();

	const repaired = normalizeVisualTemplateContent(legacyContent);
	expect(() => yaml.load(repaired)).not.toThrow();
	expect(extractVisualModelFromContent(repaired)?.version).toBe(1);
});
