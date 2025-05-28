 
export interface RouteHandler {
    handle(request: Request, env: Env): Promise<Response | null>;
}

export interface RouteMatch {
    handler: RouteHandler;
    params?: Record<string, string>;
} 