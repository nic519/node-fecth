import { expect, test } from 'bun:test';
import yaml from 'js-yaml';
import { compileFilter, compileVisualTemplate, resolveProxyName } from '@/app/admin/templates/visual-template/compiler';
import { minimalVisualTemplateModel } from '@/app/admin/templates/visual-template/fixtures';
import {
	extractVisualModelFromContent,
	normalizeVisualTemplateContent,
	stripVisualModelMetadata,
	wrapVisualModelContent,
} from '@/app/admin/templates/visual-template/metadata';
import { composeVisualTemplateContent } from '@/app/admin/templates/visual-template/compose';

test('compileFilter creates include and exclude regex', () => {
	expect(compileFilter({ include: ['港', 'HK'], exclude: ['1.5', '倍率:2'] })).toBe('(?=(港|HK))(?!.*(1\\.5|倍率:2))');
});

test('resolveProxyName resolves policy titles and builtin aliases', () => {
	expect(resolveProxyName('[自动]-香港🇭🇰', minimalVisualTemplateModel)).toBe('[自动]-香港🇭🇰');
	expect(resolveProxyName('direct', minimalVisualTemplateModel)).toBe('🇨🇳 直连');
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
	expect(extracted?.policies.find((policy) => policy.title === '[单]-WhatsApp💬')?.rules?.[0]?.name).toBe('whatsapp_domain');
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

test('stripVisualModelMetadata returns plain YAML without the embedded model block', () => {
	const content = wrapVisualModelContent(minimalVisualTemplateModel);
	const stripped = stripVisualModelMetadata(content);

	expect(stripped).not.toContain('# visual-v1:model:');
	expect(stripped).toContain('proxy-groups:');
	expect(yaml.load(stripped)).toMatchObject({
		'proxy-groups': expect.any(Array),
	});
});

test('composeVisualTemplateContent merges original yaml with compiled visual model only at output time', () => {
	const originalYaml = [
		'proxies:',
		'  - { name: 🇨🇳 直连, type: direct }',
		'port: 7890',
		'country_pr: &country_pr ["[自动]-香港🇭🇰", "🇨🇳 直连"]',
		'proxy-groups:',
		'  - { name: "旧 YAML 组", type: select, proxies: *country_pr }',
		'rules:',
		'  - IP-CIDR,192.168.0.0/16,DIRECT',
		'  - RULE-SET,cn_domain,DIRECT',
		'  - MATCH,旧 YAML 组',
		'rule-anchor:',
		'  domain: &domain { type: http, interval: 86400, behavior: domain, format: mrs }',
		'rule-providers:',
		'  cn_domain: { <<: *domain, url: "https://example.test/cn.mrs" }',
	].join('\n');

	const composed = yaml.load(composeVisualTemplateContent(originalYaml, minimalVisualTemplateModel)) as Record<string, unknown>;
	const proxyGroups = composed['proxy-groups'] as Record<string, unknown>[];
	const rules = composed.rules as string[];
	const providers = composed['rule-providers'] as Record<string, unknown>;

	expect(proxyGroups.map((group) => group.name)).toEqual(
		expect.arrayContaining(['旧 YAML 组', '[自动]-香港🇭🇰', '🚀 国外流量', '[单]-WhatsApp💬']),
	);
	expect(rules).toEqual([
		'IP-CIDR,192.168.0.0/16,DIRECT',
		'RULE-SET,cn_domain,DIRECT',
		'RULE-SET,whatsapp_domain,[单]-WhatsApp💬',
		'MATCH,🐟 漏网之鱼',
	]);
	expect(providers.cn_domain).toEqual(expect.any(Object));
	expect(providers.whatsapp_domain).toEqual(expect.any(Object));
	expect(composed.port).toBe(7890);
});
