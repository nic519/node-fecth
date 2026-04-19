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
