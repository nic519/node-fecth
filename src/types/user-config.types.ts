import { UserConfig as BaseUserConfig } from './user.types';

export type UserConfig = BaseUserConfig;

export interface ConfigResponse {
	config: UserConfig;
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
	configToYaml(config: UserConfig | null): string;
	yamlToConfig(yaml: string): UserConfig;
	getDefaultConfigYaml(): string;
	formatTime(isoString: string | null): string;
}
