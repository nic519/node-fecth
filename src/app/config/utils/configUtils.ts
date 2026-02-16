/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UserConfig } from '@/types/user-config';

/**
 * 将配置对象转换为 YAML 字符串
 */
export function configToYaml(config: UserConfig): string {
	let yaml = `subscribe: "${config.subscribe}"\naccessToken: "${config.accessToken}"`;

	if (config.ruleUrl) yaml += `\nruleUrl: "${config.ruleUrl}"`;
	if (config.fileName) yaml += `\nfileName: "${config.fileName}"`;

	if (config.multiPortMode && config.multiPortMode.length > 0) {
		yaml += `\nmultiPortMode:\n${config.multiPortMode.map((area) => `  - ${area}`).join('\n')}`;
	}

	if (config.excludeRegex) yaml += `\nexcludeRegex: "${config.excludeRegex}"`;

	if (config.appendSubList && config.appendSubList.length > 0) {
		yaml += `\nappendSubList:`;
		config.appendSubList.forEach((sub) => {
			yaml += `\n  - subscribe: "${sub.subscribe}"`;
			yaml += `\n    flag: "${sub.flag}"`;
			if (sub.includeArea && sub.includeArea.length > 0) {
				yaml += `\n    includeArea:\n${sub.includeArea.map((area) => `      - ${area}`).join('\n')}`;
			}
		});
	}

	return yaml;
}

/**
 * 将 YAML 字符串转换为配置对象
 */
export function yamlToConfig(yaml: string): UserConfig {
	const lines = yaml.split('\n');
	const config: any = {};
	let currentArray: string | null = null;
	let currentObject: any = null;
	let isInAppendSub = false;

	lines.forEach((line) => {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) return;

		if (trimmed.includes(':')) {
			const [key, ...valueParts] = trimmed.split(':');
			const value = valueParts.join(':').trim();

			if (key === 'multiPortMode' || key === 'appendSubList') {
				currentArray = key;
				config[key] = [];
				isInAppendSub = key === 'appendSubList';
			} else if (line.startsWith('  - ')) {
				if (currentArray === 'multiPortMode' && currentArray) {
					config[currentArray].push(key.replace('- ', '').trim());
				} else if (isInAppendSub && key === '- subscribe' && currentArray) {
					currentObject = { subscribe: value.replace(/"/g, '') };
					config[currentArray].push(currentObject);
				}
			} else if (line.startsWith('    ')) {
				if (currentObject && key === 'flag') {
					currentObject.flag = value.replace(/"/g, '');
				} else if (currentObject && key === 'includeArea') {
					currentObject.includeArea = [];
				}
			} else if (line.startsWith('      - ') && currentObject && currentObject.includeArea) {
				currentObject.includeArea.push(key.replace('- ', '').trim());
			} else {
				currentArray = null;
				isInAppendSub = false;
				currentObject = null;
				if (value.startsWith('"') && value.endsWith('"')) {
					config[key.trim()] = value.slice(1, -1);
				} else if (value) {
					config[key.trim()] = value;
				}
			}
		}
	});

	return config as UserConfig;
}

/**
 * 验证 YAML 配置
 */
export function validateConfig(yaml: string): { errors: string[]; configPreview: any | null } {
	const errors: string[] = [];

	try {
		const lines = yaml.split('\n');
		const hasSubscribe = lines.some((line) => line.trim().startsWith('subscribe:'));
		const hasAccessToken = lines.some((line) => line.trim().startsWith('accessToken:'));

		if (!hasSubscribe) {
			errors.push('缺少必需字段: subscribe');
		}
		if (!hasAccessToken) {
			errors.push('缺少必需字段: accessToken');
		}

		// 简单的 YAML 语法检查
		lines.forEach((line, index) => {
			if (line.trim() && line.includes(':') && !line.trim().startsWith('#')) {
				const colonIndex = line.indexOf(':');
				if (colonIndex === 0) {
					errors.push(`第 ${index + 1} 行: 字段名不能为空`);
				}
			}
		});

		const configPreview = errors.length === 0 ? yamlToConfig(yaml) : null;
		return { errors, configPreview };
	} catch {
		errors.push('YAML 格式错误');
		return { errors, configPreview: null };
	}
}

/**
 * 格式化时间
 */
export function formatTime(date: Date): string {
	return date.toLocaleString('zh-CN', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (err) {
		console.error('复制失败:', err);
		return false;
	}
} 