import type { VisualTemplateModel } from './types';

export const minimalVisualTemplateModel: VisualTemplateModel = {
	version: 1,
	providerDefaults: {
		type: 'http',
		interval: 86400,
	},
	urlTestDefaults: {
		interval: 200,
		tolerance: 23,
	},
	policies: [
		{
			id: 'auto-hk',
			title: '香港',
			compileName: '[自动]-香港🇭🇰',
			type: 'url-test',
			tags: ['region'],
			includeAll: true,
			filter: {
				include: ['港', 'HK', 'Hong', '🇭🇰'],
				exclude: ['1.5', '倍率:2'],
			},
			urlTest: {
				interval: 200,
				tolerance: 23,
			},
		},
		{
			id: 'foreign',
			title: '国外流量',
			compileName: '🚀 国外流量',
			type: 'select',
			tags: ['system'],
			proxies: [{ id: 'auto-hk' }, { id: 'direct' }],
		},
		{
			id: 'whatsapp',
			title: 'WhatsApp',
			compileName: '[单]-WhatsApp💬',
			type: 'select',
			tags: ['app'],
			proxies: [{ id: 'foreign' }, { id: 'direct' }],
			includeAll: true,
			filter: {
				include: ['台', 'TW', 'SG', 'JP', 'HK', '香港', '美'],
			},
			rules: [
				{
					id: 'whatsapp-domain',
					providerKey: 'whatsapp_domain',
					behavior: 'domain',
					format: 'mrs',
					url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/whatsapp.mrs',
				},
			],
		},
	],
};
