import { expect, test } from 'bun:test';

import { UserConfigSchema } from '@/modules/user/user.schema';

test('UserConfigSchema does not require or retain top-level subscribe', () => {
	const parsed = UserConfigSchema.parse({
		accessToken: 'token',
		subscribe: 'https://legacy.example.com/sub',
		appendSubList: [
			{
				subscribe: 'https://primary.example.com/sub',
				flag: 'A',
			},
		],
	});

	expect(parsed).toEqual({
		accessToken: 'token',
		appendSubList: [
			{
				subscribe: 'https://primary.example.com/sub',
				flag: 'A',
			},
		],
	});
});

test('UserConfigSchema allows a blank flag for a single subscription source', () => {
	const parsed = UserConfigSchema.parse({
		accessToken: 'token',
		appendSubList: [
			{
				subscribe: 'https://primary.example.com/sub',
				flag: '',
			},
		],
	});

	expect(parsed.appendSubList?.[0]?.flag).toBe('');
});

test('UserConfigSchema rejects blank flags when multiple subscription sources are configured', () => {
	const result = UserConfigSchema.safeParse({
		accessToken: 'token',
		appendSubList: [
			{
				subscribe: 'https://primary.example.com/sub',
				flag: '',
			},
			{
				subscribe: 'https://secondary.example.com/sub',
				flag: 'B',
			},
		],
	});

	expect(result.success).toBe(false);
	if (!result.success) {
		expect(result.error.issues[0]?.message).toBe('多个订阅源时标识不能为空');
	}
});

test('UserConfigSchema accepts a proxy provider on a subscription source', () => {
	const parsed = UserConfigSchema.parse({
		accessToken: 'token',
		appendSubList: [
			{
				subscribe: 'https://primary.example.com/sub',
				flag: 'A',
				proxyProvider: 'cloudflare',
			},
		],
	});

	expect(parsed.appendSubList?.[0]?.proxyProvider).toBe('cloudflare');
});

test('inline sources accept proxies without a URL and reject invalid YAML', () => {
 const source = { type: 'inline', flag: 'A', proxiesYaml: 'proxies:\n  - {name: 香港, type: trojan, server: example.com, port: 443, password: secret}' };
 const parsed = UserConfigSchema.parse({accessToken:'token',appendSubList:[source]});
 expect(parsed.appendSubList?.[0]?.type).toBe('inline');
 for (const proxiesYaml of ['proxies: []', 'proxies: [', '- {name: bad}', 'rules: []']) {
  expect(UserConfigSchema.safeParse({accessToken:'token',appendSubList:[{...source,proxiesYaml}]}).success).toBe(false);
 }
});

test('inline source save round-trip retains only proxies and preserves protocol options', () => {
 const config = UserConfigSchema.parse({accessToken:'token',appendSubList:[{
  type:'inline',subscribe:'https://unused.example.com',proxyProvider:'cloudflare',flag:'A',
  proxiesYaml:'dns: {enable: false}\nrules: [MATCH,REJECT]\nproxies:\n  - {name: node, type: trojan, server: example.com, port: 443, password: "123", sni: example.com, alpn: [h2], udp: true}'
 }]});
 const stored = UserConfigSchema.parse(JSON.parse(JSON.stringify(config)));
 expect(stored.appendSubList?.[0]?.subscribe).toBe('');
 expect(stored.appendSubList?.[0]?.proxyProvider).toBeUndefined();
 expect(stored.appendSubList?.[0]?.proxiesYaml).not.toContain('rules:');
 expect(stored.appendSubList?.[0]?.proxiesYaml).toContain('alpn:');
 expect(stored.appendSubList?.[0]?.proxiesYaml).toContain('password:');
});

test('inline sources reject duplicate names and invalid ports without exposing pasted data', () => {
 for (const proxiesYaml of [
  '- {name: same, type: direct}\n- {name: same, type: direct}',
  '- {name: node, type: trojan, server: example.com, port: 99999, password: PRIVATE_PASSWORD}',
  'proxies: [PRIVATE_PASSWORD',
 ]) {
  const result = UserConfigSchema.safeParse({accessToken:'token',appendSubList:[{type:'inline',flag:'',proxiesYaml}]});
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.message).not.toContain('PRIVATE_PASSWORD');
 }
});
