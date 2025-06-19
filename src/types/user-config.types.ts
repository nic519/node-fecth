export interface UserConfig {
	subscribe?: string;
	accessToken?: string;
	ruleUrl?: string;
	fileName?: string;
	multiPortMode?: string[];
	appendSubList?: Array<{
		subscribe: string;
		flag: string;
		includeArea?: string[];
	}>;
	excludeRegex?: string;
}

export interface ConfigResponse {
	config: UserConfig;
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
