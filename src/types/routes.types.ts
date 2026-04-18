/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RouteHandler {
	handle(request: Request, params?: Record<string, any>): Promise<Response | null>;
}

export interface RouteMatch {
	handler: RouteHandler;
	params?: Record<string, any>;
}
