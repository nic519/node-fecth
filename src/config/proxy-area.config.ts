import { ProxyAreaInfo } from '@/types/clash.types';

export const ProxyAreaObjects: ProxyAreaInfo[] = [
	{
		code: 'TW',
		regex: 'TW|台湾',
		startPort: 0,
	},
	{
		code: 'SG',
		regex: 'SG|新加坡',
		startPort: 100,
	},
	{
		code: 'JP',
		regex: 'JP|日本',
		startPort: 200,
	},
	{
		code: 'VN',
		regex: 'VN|越南',
		startPort: 700,
	},
	{
		code: 'HK',
		regex: 'HK|香港',
		startPort: 300,
	},
	{
		code: 'US',
		regex: 'US|美国',
		startPort: 800,
	},
];
