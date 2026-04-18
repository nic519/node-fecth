
export interface AppConfig {
	workerUrl: string;
}

export const appConfig = {
	workerUrl: 'https://node.1024.hair',
} as const satisfies AppConfig;
