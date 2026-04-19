/**
 * 通用 API 响应接口
 * 用于前端数据请求的类型定义
 */
export interface ApiResponse<T = unknown> {
	// 业务响应码，0 通常表示成功。
	code: number;
	// 响应消息。
	msg: string;
	// 响应数据。
	data: T;
}
