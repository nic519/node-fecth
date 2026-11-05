import { ProxyAreaInfo } from '@/types/clash.types';

export const AREA_CODES = ['TW', 'SG', 'JP', 'VN', 'HK', 'US'] as const;

export const AREA_EMOJI: Record<(typeof AREA_CODES)[number], string> = {
	TW: '🏝️',
	SG: '🇸🇬',
	JP: '🇯🇵',
	VN: '🇻🇳',
	HK: '🇭🇰',
	US: '🇺🇸',
};

export const ProxyAreaObjects: ProxyAreaInfo[] = [
	{
		code: 'TW',
		regex: 'TW|台湾|Taiwan',
		startPort: 0,
	},
	{
		code: 'SG',
		regex: '🇸🇬|SG|新加坡|Singapore',
		startPort: 100,
	},
	{
		code: 'JP',
		regex: '🇯🇵|JP|日本|Japan',
		startPort: 200,
	},
	{
		code: 'VN',
		regex: '🇻🇳|VN|越南|Vietnam',
		startPort: 700,
	},
	{
		code: 'HK',
		regex: '🇭🇰|HK|香港|Hong Kong',
		startPort: 300,
	},
	{
		code: 'US',
		regex: '🇺🇸|US|美国|United States',
		startPort: 800,
	},
];
