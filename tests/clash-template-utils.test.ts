import { expect, test } from 'bun:test';

import {
	applyProxyGroupFilter,
	applyProxyGroupOptions,
	buildFilterFromKeywords,
	extractFilterPresets,
	extractProxyGroupSummaries,
	findProxyGroupLineNumber,
	parseClashTemplate,
} from '@/app/admin/templates/utils/clash-template-utils';

const sampleYaml = [
	'port: 7890',
	'proxy-groups:',
	'  - name: "🇭🇰 HK Auto"',
	'    type: select',
	'    proxies:',
	'      - hk-1',
	'      - DIRECT',
	'  - name: "🇯🇵 JP Auto"',
	'    type: select',
	'    proxies:',
	'      - jp-1',
	'  - name: "Global"',
	'    type: select',
	'    proxies:',
	'      - "🇭🇰 HK Auto"',
	'      - "🇯🇵 JP Auto"',
].join('\n');

test('parseClashTemplate extracts proxy groups', () => {
	const result = parseClashTemplate(sampleYaml);

	expect(result.ok).toBe(true);
	if (!result.ok) return;

	expect(result.groupNames).toEqual(['🇭🇰 HK Auto', '🇯🇵 JP Auto', 'Global']);
});

test('parseClashTemplate returns a parse error for invalid YAML', () => {
	const result = parseClashTemplate('proxy-groups:\n  - name: broken\n    type');

	expect(result.ok).toBe(false);
	if (result.ok) return;

	expect(result.error).toContain('YAML');
});

test('extractProxyGroupSummaries describes proxy-group fields without touching rules', () => {
	const result = parseClashTemplate(sampleYaml);
	expect(result.ok).toBe(true);
	if (!result.ok) return;

	expect(extractProxyGroupSummaries(result)).toEqual([
		{
			name: '🇭🇰 HK Auto',
			type: 'select',
			includeAll: false,
			includeAllProxies: false,
			includeAllProviders: false,
			disableUdp: false,
			hidden: false,
			filter: '',
			excludeFilter: '',
			excludeType: '',
			proxyCount: 2,
			proxies: ['hk-1', 'DIRECT'],
			use: [],
			url: '',
			tolerance: null,
			interval: null,
			lazy: null,
			timeout: null,
			maxFailedTimes: null,
			expectedStatus: '',
			icon: '',
			strategy: '',
			ruleAssociations: [],
		},
		{
			name: '🇯🇵 JP Auto',
			type: 'select',
			includeAll: false,
			includeAllProxies: false,
			includeAllProviders: false,
			disableUdp: false,
			hidden: false,
			filter: '',
			excludeFilter: '',
			excludeType: '',
			proxyCount: 1,
			proxies: ['jp-1'],
			use: [],
			url: '',
			tolerance: null,
			interval: null,
			lazy: null,
			timeout: null,
			maxFailedTimes: null,
			expectedStatus: '',
			icon: '',
			strategy: '',
			ruleAssociations: [],
		},
		{
			name: 'Global',
			type: 'select',
			includeAll: false,
			includeAllProxies: false,
			includeAllProviders: false,
			disableUdp: false,
			hidden: false,
			filter: '',
			excludeFilter: '',
			excludeType: '',
			proxyCount: 2,
			proxies: ['🇭🇰 HK Auto', '🇯🇵 JP Auto'],
			use: [],
			url: '',
			tolerance: null,
			interval: null,
			lazy: null,
			timeout: null,
			maxFailedTimes: null,
			expectedStatus: '',
			icon: '',
			strategy: '',
			ruleAssociations: [],
		},
	]);
});

test('extractProxyGroupSummaries includes url-test numeric options', () => {
	const content = [
		'proxy-groups:',
		'  - name: "[自动]-香港🇭🇰"',
		'    type: url-test',
		'    include-all: true',
		'    include-all-proxies: true',
		'    include-all-providers: false',
		'    url: "https://www.gstatic.com/generate_204"',
		'    tolerance: 23',
		'    interval: 200',
		'    lazy: true',
		'    timeout: 5000',
		'    max-failed-times: 5',
		'    expected-status: "204/302"',
		'    filter: "(?=(港|HK))"',
		'    exclude-filter: "倍率:2"',
		'    exclude-type: "Http"',
		'    hidden: true',
		'    icon: "https://example.com/hk.png"',
	].join('\n');
	const result = parseClashTemplate(content);
	expect(result.ok).toBe(true);
	if (!result.ok) return;

	expect(extractProxyGroupSummaries(result)[0]).toMatchObject({
		name: '[自动]-香港🇭🇰',
		type: 'url-test',
		includeAll: true,
		includeAllProxies: true,
		includeAllProviders: false,
		url: 'https://www.gstatic.com/generate_204',
		tolerance: 23,
		interval: 200,
		lazy: true,
		timeout: 5000,
		maxFailedTimes: 5,
		expectedStatus: '204/302',
		excludeFilter: '倍率:2',
		excludeType: 'Http',
		hidden: true,
		icon: 'https://example.com/hk.png',
	});
});

test('extractProxyGroupSummaries links select groups to RULE-SET providers', () => {
	const content = [
		'proxy-groups:',
		'  - { name: "[单]-Cursor🐶", type: select, proxies: ["🇨🇳 直连", "🚀 国外流量"] }',
		'rules:',
		'  - RULE-SET,cursor_domain,[单]-Cursor🐶',
		'  - RULE-SET,ai,[类]-海外AI🤖',
		'rule-providers:',
		'  cursor_domain:',
		'    url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cursor.mrs"',
	].join('\n');
	const result = parseClashTemplate(content);
	expect(result.ok).toBe(true);
	if (!result.ok) return;

	expect(extractProxyGroupSummaries(result)[0].ruleAssociations).toEqual([
		{
			ruleSet: 'cursor_domain',
			providerUrl: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cursor.mrs',
		},
	]);
});

test('findProxyGroupLineNumber locates inline and block proxy-group items', () => {
	const content = [
		'proxy-groups:',
		'  - { name: "[单]-Cursor🐶", type: select, proxies: ["DIRECT"] }',
		'  - {',
		'      name: "[自动]-美国🇺🇸",',
		'      type: url-test,',
		'      interval: 200,',
		'    }',
	].join('\n');

	expect(findProxyGroupLineNumber(content, '[单]-Cursor🐶')).toBe(2);
	expect(findProxyGroupLineNumber(content, '[自动]-美国🇺🇸')).toBe(3);
	expect(findProxyGroupLineNumber(content, 'missing')).toBeNull();
});

test('extractFilterPresets reads proxy-group filters and visual keyword parts', () => {
	const content = [
		'proxy-groups:',
		'  - name: "[自动]-速度最优⚡️"',
		'    type: url-test',
		'    include-all: true',
		'    filter: "(^(?!.*(US|荷|1\\\\.5|倍率:2|Emby|@)).*)"',
		'  - name: "[自动]-香港🇭🇰"',
		'    type: url-test',
		'    include-all: true',
		'    filter: "(?=(港|HK|Hong|🇭🇰))(?!.*(1\\\\.5|倍率:2))"',
	].join('\n');
	const parsed = parseClashTemplate(content);
	expect(parsed.ok).toBe(true);
	if (!parsed.ok) return;

	const presets = extractFilterPresets(parsed);

	expect(presets).toHaveLength(2);
	expect(presets[0]).toMatchObject({
		groupName: '[自动]-速度最优⚡️',
		includeKeywords: [],
		excludeKeywords: ['US', '荷', '1.5', '倍率:2', 'Emby', '@'],
	});
	expect(presets[1]).toMatchObject({
		groupName: '[自动]-香港🇭🇰',
		includeKeywords: ['港', 'HK', 'Hong', '🇭🇰'],
		excludeKeywords: ['1.5', '倍率:2'],
	});
});

test('extractFilterPresets visualizes positive lookahead filters', () => {
	const content = [
		'proxy-groups:',
		'  - name: "[自动]-美国🇺🇸"',
		'    type: url-test',
		'    include-all: true',
		'    filter: "^(?!.*@.*)(?=.*(?:美|US|States|America|🇺🇸))"',
	].join('\n');
	const parsed = parseClashTemplate(content);
	expect(parsed.ok).toBe(true);
	if (!parsed.ok) return;

	expect(extractFilterPresets(parsed)[0]).toMatchObject({
		groupName: '[自动]-美国🇺🇸',
		includeKeywords: ['美', 'US', 'States', 'America', '🇺🇸'],
		excludeKeywords: ['@'],
		canVisualize: true,
	});
});

test('buildFilterFromKeywords creates reusable include and exclude filter text', () => {
	expect(
		buildFilterFromKeywords({
			includeKeywords: ['港', 'HK', 'Hong', '🇭🇰'],
			excludeKeywords: ['1.5', '倍率:2'],
		}),
	).toBe('(?=(港|HK|Hong|🇭🇰))(?!.*(1\\.5|倍率:2))');
});

test('applyProxyGroupFilter updates one group filter without changing other fields', () => {
	const content = [
		'proxy-groups:',
		'  - name: "[自动]-香港🇭🇰"',
		'    type: url-test',
		'    include-all: true',
		'    tolerance: 23',
		'    filter: "(?=(港|HK|Hong|🇭🇰))(?!.*(1\\\\.5|倍率:2))"',
		'  - name: "[自动]-日本🇯🇵"',
		'    type: url-test',
		'    include-all: true',
		'    tolerance: 23',
	].join('\n');

	const result = applyProxyGroupFilter(content, '[自动]-日本🇯🇵', '(?=(日|JP|Japan|🇯🇵))(?!.*(1\\.5|倍率:2))');

	expect(result.ok).toBe(true);
	if (!result.ok) return;

	expect(result.content).toContain('name: "[自动]-日本🇯🇵"');
	expect(result.content).toContain('tolerance: 23');
	expect(result.content).toContain('filter: "(?=(日|JP|Japan|🇯🇵))(?!.*(1\\\\.5|倍率:2))"');
});

test('applyProxyGroupFilter preserves named YAML anchors used by proxy-groups', () => {
	const content = [
		'country_pr: &country_pr ["[自动]-香港🇭🇰", "[自动]-日本🇯🇵"]',
		'proxy-groups:',
		'  - { name: "[单]-TikTok🎵", type: select, proxies: *country_pr }',
		'  - { name: "[自动]-香港🇭🇰", type: url-test, include-all: true, filter: "(?=(港|HK))" }',
	].join('\n');

	const result = applyProxyGroupFilter(content, '[自动]-香港🇭🇰', '(?=(港|HK|Hong|🇭🇰))(?!.*(1\\.5|倍率:2))');

	expect(result.ok).toBe(true);
	if (!result.ok) return;

	expect(result.content).toContain('&country_pr');
	expect(result.content).toContain('proxies: *country_pr');
	expect(result.content).toContain('filter: "(?=(港|HK|Hong|🇭🇰))(?!.*(1\\\\.5|倍率:2))"');
});

test('applyProxyGroupOptions updates proxy-group scalar fields without expanding anchors', () => {
	const content = [
		'country_pr: &country_pr ["[自动]-香港🇭🇰", "[自动]-日本🇯🇵"]',
		'proxy-groups:',
		'  - { name: "[单]-TikTok🎵", type: select, proxies: *country_pr }',
		'  - { name: "[自动]-香港🇭🇰", type: url-test, include-all: true, tolerance: 23, interval: 200, filter: "(?=(港|HK))" }',
	].join('\n');

	const result = applyProxyGroupOptions(content, '[自动]-香港🇭🇰', {
		tolerance: 50,
		interval: 300,
		lazy: false,
		url: 'https://cp.cloudflare.com/generate_204',
		expectedStatus: '204/302',
	});

	expect(result.ok).toBe(true);
	if (!result.ok) return;

	expect(result.content).toContain('&country_pr');
	expect(result.content).toContain('proxies: *country_pr');
	expect(result.content).toContain('tolerance: 50');
	expect(result.content).toContain('interval: 300');
	expect(result.content).toContain('lazy: false');
	expect(result.content).toContain('url: "https://cp.cloudflare.com/generate_204"');
	expect(result.content).toContain('expected-status: "204/302"');
});
