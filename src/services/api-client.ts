import type { ApiResponse } from '@/types/api';

type RequestParams = Record<string, string | number | boolean>;

/**
 * 统一的 API 客户端
 * 封装了 fetch 请求，提供类型安全和错误处理
 */
class ApiClient {
    private baseUrl: string = '/api';

    /**
     * 构建 URL，附加查询参数
     */
    private buildUrl(endpoint: string, params?: RequestParams): string {
        let url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        url = `${this.baseUrl}${url}`;

        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
            }
        }

        return url;
    }

    /**
     * 发送请求
     */
    private async request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            // 处理非 JSON 响应（如果是空的或纯文本）
            const contentType = response.headers.get('content-type');
            let data: unknown;

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // 如果不是 JSON，尝试读取文本
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    // 如果不是 JSON 格式，构造一个临时的错误对象
                    data = { msg: text || response.statusText, code: response.status };
                }
            }

            if (!response.ok) {
                let message = `请求失败: ${response.status}`;
                if (data && typeof data === 'object' && 'msg' in data) {
                    const msg = (data as { msg?: unknown }).msg;
                    if (typeof msg === 'string') {
                        message = msg;
                    }
                }
                throw new Error(message);
            }

            return data as ApiResponse<T>;
        } catch (error) {
            console.error(`API Request Error [${url}]:`, error);
            throw error;
        }
    }

    /**
     * GET 请求
     */
    async get<T>(endpoint: string, params?: RequestParams, options?: RequestInit): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, params);
        return this.request<T>(url, { ...options, method: 'GET' });
    }

    /**
     * POST 请求
     */
    async post<T>(endpoint: string, body: unknown, params?: RequestParams, options?: RequestInit): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, params);
        return this.request<T>(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * PUT 请求
     */
    async put<T>(endpoint: string, body: unknown, params?: RequestParams, options?: RequestInit): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, params);
        return this.request<T>(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    /**
     * DELETE 请求
     */
    async delete<T>(endpoint: string, params?: RequestParams, options?: RequestInit): Promise<ApiResponse<T>> {
        const url = this.buildUrl(endpoint, params);
        return this.request<T>(url, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
