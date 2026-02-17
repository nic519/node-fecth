/**
 * 通用 API 响应接口
 * 用于前端数据请求的类型定义
 */
export interface ApiResponse<T = unknown> {
    code: number;
    msg: string;
    data: T;
}
