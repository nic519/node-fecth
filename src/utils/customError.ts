export enum ErrorCode {
	INVALID_YAML = 'INVALID_YAML',
	NO_PROXIES_FOUND = 'NO_PROXIES_FOUND',
	SUBSCRIPTION_FETCH_FAILED = 'SUBSCRIPTION_FETCH_FAILED',
	INVALID_CONFIG = 'INVALID_CONFIG',
	TOKEN_VALIDATION_FAILED = 'TOKEN_VALIDATION_FAILED',
}

export class CustomError extends Error {
	constructor(public code: ErrorCode, message: string, public statusCode: number = 400, public details?: any) {
		super(message);
		this.name = 'CustomError';
	}
}
