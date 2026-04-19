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
