import { afterEach, expect, mock, test } from 'bun:test';

import { DEFAULT_SUB_FLAG } from '@/config/constants';
import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { StrategyMultiSub } from '@/modules/yamlMerge/strategyMultiSub';
import type { UserConfig } from '@/types/api-schemas';

const originalGetWithCache = DynamicService.getWithCache;

afterEach(() => {
	DynamicService.getWithCache = originalGetWithCache;
	mock.restore();
});

test('StrategyMultiSub fetches an appendSubList subscription once', async () => {
	const requestedUrls: string[] = [];
	const primarySubscribe = 'https://primary.example.com/sub';

	DynamicService.getWithCache = (async (url: string) => {
		requestedUrls.push(url);
		return {
			content: 'proxies: []',
			traffic: 'upload=1; download=1; total=10; expire=1776700800',
		};
	}) as typeof DynamicService.getWithCache;

	const config: UserConfig = {
		accessToken: 'token',
		excludeRegex: '',
		appendSubList: [
			{
				subscribe: primarySubscribe,
				flag: DEFAULT_SUB_FLAG,
			},
		],
	};

	const strategy = new StrategyMultiSub('proxies: []', config, 'user-id');

	await strategy.generate();

	expect(requestedUrls).toEqual([primarySubscribe]);
});

test('StrategyMultiSub does not fetch when appendSubList is empty', async () => {
	const requestedUrls: string[] = [];

	DynamicService.getWithCache = (async (url: string) => {
		requestedUrls.push(url);
		return {
			content: 'proxies: []',
			traffic: '',
		};
	}) as typeof DynamicService.getWithCache;

	const config: UserConfig = {
		accessToken: 'token',
		excludeRegex: '',
		appendSubList: [],
	};

	const strategy = new StrategyMultiSub('proxies: []', config, 'user-id');

	await strategy.generate();

	expect(requestedUrls).toEqual([]);
});

test('inline nodes merge with remote nodes without fetching inline content', async () => {
 const urls: string[] = [];
 DynamicService.getWithCache = async (url) => { urls.push(url); return {id:'remote',url,content:'proxies: [{name: Remote, type: http, server: example.com, port: 80}]',traffic:null,updatedAt:''}; };
 const config = {accessToken:'token',appendSubList:[
  {type:'inline' as const,subscribe:'',flag:'A',includeArea:['HK' as const],proxiesYaml:'- {name: 香港, type: trojan, server: hk.example.com, port: 443, password: secret, sni: tls.example.com}\n- {name: 日本, type: trojan, server: jp.example.com, port: 443, password: other}'},
  {subscribe:'https://example.com/sub',flag:'B'}
 ]};
 const result = await new StrategyMultiSub('proxies: []',config).generate();
 expect(urls).toEqual(['https://example.com/sub']);
 expect(result.yamlContent.proxies).toEqual([
  {name:'A-香港',type:'trojan',server:'hk.example.com',port:443,password:'secret',sni:'tls.example.com'},
  {name:'B-Remote',type:'http',server:'example.com',port:80}
 ]);
});
