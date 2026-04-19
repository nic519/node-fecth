import { afterEach, expect, mock, test } from 'bun:test';

import { DEFAULT_SUB_FLAG } from '@/config/constants';
import { DynamicService } from '@/modules/dynamic/dynamic.service';
import { StrategyMultiSub } from '@/modules/yamlMerge/strategyMultiSub';
import type { UserConfig } from '@/types/openapi-schemas';

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
