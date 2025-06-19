// 从Zod schema导入类型和验证函数
export type { UserConfig, SubConfig, AreaCode } from './user-config.schema';

export { validateUserConfig, validateUserConfigStrict } from './user-config.schema';

// 前端特定的类型定义
export interface ConfigResponse {
	config: import('./user-config.schema').UserConfig;
	meta: {
		lastModified: string;
		source: string;
	};
}

export interface YamlConfigResponse {
	yaml: string;
	meta: {
		lastModified: string;
		source: string;
	};
}

export interface EditorInterface {
	getValue(): string;
	setValue(value: string): void;
	onDidChangeModelContent(callback: () => void): void;
	getModel(): {
		getLineCount(): number;
	};
}

export type ConnectionStatus = 'connecting' | 'connected' | 'error';

export interface ConfigManager {
	editor: EditorInterface | null;
	configPreview: string;
	validationErrors: string[];
	saving: boolean;
	lastSaved: string | null;
	lastModified: string | null;
	configSource: string;
	connectionStatus: ConnectionStatus;
	userId: string;

	init(): void;
	initSimpleEditor(): void;
	loadConfig(): Promise<void>;
	updatePreview(): void;
	validateConfig(yaml: string): void;
	saveConfig(): Promise<void>;
	resetConfig(): void;
	configToYaml(config: import('./user-config.schema').UserConfig | null): string;
	yamlToConfig(yaml: string): import('./user-config.schema').UserConfig;
	getDefaultConfigYaml(): string;
	formatTime(isoString: string | null): string;
}
