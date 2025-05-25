// 声明Env接口，与worker-configuration.d.ts保持一致
interface Env {
    USER_CONFIGS: any;
    KV_BINDING: KVNamespace;
}

export interface RouteHandler {
    handle(request: Request, env: Env): Promise<Response | null>;
}

export interface RouteMatch {
    handler: RouteHandler;
    params?: Record<string, string>;
} 