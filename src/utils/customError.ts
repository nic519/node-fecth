export enum ErrorCode {
  INVALID_YAML = 'INVALID_YAML',
  NO_PROXIES_FOUND = 'NO_PROXIES_FOUND',
  SUBSCRIPTION_FETCH_FAILED = 'SUBSCRIPTION_FETCH_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  TOKEN_VALIDATION_FAILED = 'TOKEN_VALIDATION_FAILED'
}

export class CustomError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'CustomError';
  }
}

export class ErrorHandler {
  static createResponse(error: CustomError | Error): Response {
    if (error instanceof CustomError) {
      return new Response(JSON.stringify({
        error: true,
        code: error.code,
        message: error.message,
        details: error.details
      }), {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 对于未知错误，返回通用错误信息
    return new Response(JSON.stringify({
      error: true,
      code: 'UNKNOWN_ERROR',
      message: '服务器内部错误',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 