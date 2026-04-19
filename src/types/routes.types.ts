/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 路由处理器接口。
 *
 * 描述自定义路由匹配后可执行的请求处理逻辑。
 */
export interface RouteHandler {
	// 处理请求并返回响应；返回 null 表示当前处理器不产出响应。
	handle(request: Request, params?: Record<string, any>): Promise<Response | null>;
}

/**
 * 路由匹配结果。
 *
 * 保存匹配到的处理器以及从路径中提取的参数。
 */
export interface RouteMatch {
	// 匹配到的路由处理器。
	handler: RouteHandler;
	// 路由路径参数。
	params?: Record<string, any>;
}
