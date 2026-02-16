export enum ErrorCode {
	INVALID_YAML = 'INVALID_YAML',
	NO_PROXIES_FOUND = 'NO_PROXIES_FOUND',
	SUBSCRIPTION_FETCH_FAILED = 'SUBSCRIPTION_FETCH_FAILED',
	INVALID_CONFIG = 'INVALID_CONFIG',
	TOKEN_VALIDATION_FAILED = 'TOKEN_VALIDATION_FAILED',
	// SSR相关错误代码
	INVALID_NODE_FORMAT = 'INVALID_NODE_FORMAT',
	NO_VALID_NODES = 'NO_VALID_NODES',
	INVALID_SUBSCRIPTION_FORMAT = 'INVALID_SUBSCRIPTION_FORMAT',
	CONVERSION_FAILED = 'CONVERSION_FAILED',
	YAML_GENERATION_FAILED = 'YAML_GENERATION_FAILED',
	STATS_GENERATION_FAILED = 'STATS_GENERATION_FAILED',
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export class CustomError extends Error {
	constructor(public code: ErrorCode, message: string, public statusCode: number = 400, public details?: any) {
		super(message);
		this.name = 'CustomError';
	}
}
