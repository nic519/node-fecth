import { RouteHandler } from '@/routes/types';
import { getUserConfig, RESPONSE_HEADERS, UserConfig } from '@/types/types';
import { ConfigValidator } from '@/module/configValidator';
import { YamlMerge } from '@/module/yamlMerge';
import { ClashYamlMerge } from '@/module/clashYamlMerge';

export class SubscriptionHandler implements RouteHandler {
    private configValidator = new ConfigValidator();
    
    async handle(request: Request, env: Env, params?: Record<string, string>): Promise<Response | null> {
        const url = new URL(request.url);
        const uid = params?.uid || url.pathname.slice(1);
        const token = url.searchParams.get('token');
        
        // 验证token
        const authConfig = this.validateToken(uid, token, env);
        if (authConfig instanceof Response) return authConfig;
        
        try {
            const target = url.searchParams.get('target') || 'clash';
            const yamlMerge = new YamlMerge(authConfig.SUB_URL!, authConfig.RULE_URL!);
            const { yamlContent, subInfo } = await yamlMerge.merge();
             
            // 使用配置验证器验证格式
            const formatError = this.configValidator.validate(yamlContent, target);
            if (formatError) return formatError;

            return new Response(yamlContent, {
                status: 200,
                headers: {
                    ...RESPONSE_HEADERS,
                    'Content-Type': target === 'clash' ? 'text/yaml; charset=utf-8' : 'application/json; charset=utf-8',
                    'Subscription-Userinfo': subInfo,
                    'Content-Disposition': `attachment; filename=${authConfig.FILE_NAME}.${target === 'clash' ? 'yaml' : 'json'}`
                }
            });
        } catch (error) {
            console.error('Error:', error);
            return new Response("处理订阅时发生错误", { status: 500 });
        }
    }
    
    /**
     * 验证token
     * @param uid 用户id
     * @param token 访问token
     * @param env 环境变量
     * @returns 用户配置或401响应
     */
    private validateToken(uid: string, token: string | null, env: Env): UserConfig | Response {
        if (!uid || !token) {
            return new Response('Unauthorized', { status: 401 });
        }
        const userConfig = getUserConfig(env, uid);
        if (!userConfig || token !== userConfig.ACCESS_TOKEN) {
            return new Response('Unauthorized', { status: 401 });
        }
        return userConfig;
    }
} 