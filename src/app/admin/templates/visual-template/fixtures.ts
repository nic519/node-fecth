import type { VisualTemplateModel } from './types';

export const minimalVisualTemplateModel: VisualTemplateModel = {
	version: 1,
	policies: [
		{
			title: '[自动]-香港🇭🇰',
			type: 'url-test',
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
			title: '🚀 国外流量',
			type: 'select',
			proxies: ['[自动]-香港🇭🇰', 'direct'],
		},
		{
			title: '[单]-WhatsApp💬',
			type: 'select',
			proxies: ['🚀 国外流量', 'direct'],
			includeAll: true,
			filter: {
				include: ['台', 'TW', 'SG', 'JP', 'HK', '香港', '美'],
			},
			rules: [
				{
					name: 'whatsapp_domain',
					behavior: 'domain',
					format: 'mrs',
					url: 'https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/whatsapp.mrs',
				},
			],
		},
	],
};
