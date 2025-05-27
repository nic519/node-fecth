import { RouteHandler } from '@/routes/types';
import { RESPONSE_HEADERS, UserConfig } from '@/types/types';
import { ConfigValidator } from '@/module/configValidator'; 
import { ClashYamlMerge } from '@/module/clashYamlMerge';
import { AuthUtils } from '@/utils/authUtils';
import { CustomError, ErrorHandler, ErrorCode } from '@/utils/customError';

export class SubHandlerFast implements RouteHandler {
    private configValidator = new ConfigValidator();
    
    async handle(request: Request, env: Env, params?: Record<string, string>): Promise<Response | null> {
        console.log('\n' + '='.repeat(50));
        console.log('🚀 开始处理 /quick 路由请求');
        console.log('='.repeat(50));
        
        const url = new URL(request.url);
        console.log('📍 请求URL:', url.toString());
        
        // 获取参数
        const uid = url.searchParams.get('uid');
        const token = url.searchParams.get('token');
        
        console.log('👤 用户参数:', { uid, token });
        
        if (!uid || !token) {
            console.log('❌ 缺少必要参数');
            return new Response('缺少必要参数: uid, token', { status: 400 });
        }
        
        // 验证token
        console.log('🔐 开始验证Token...');
        const authConfig = AuthUtils.validateToken(uid, token, env);
        if (authConfig instanceof Response) {
            console.log('❌ Token验证失败');
            return authConfig;
        }
        
        console.log('✅ Token验证通过');
        console.log('📋 用户配置:', JSON.stringify(authConfig, null, 2));
        
        try {
            // 处理订阅逻辑
            console.log('🎯 开始处理订阅...');
            
            const target = url.searchParams.get('target') || 'clash';
            console.log(`🎯 目标格式: ${target}`);
        
            const clashYamlMerge = new ClashYamlMerge(env, request, authConfig.SUB_URL!, authConfig.RULE_URL!, token, uid);
            const { yamlContent, subInfo } = await clashYamlMerge.merge();
            // 使用配置验证器验证格式
            const formatError = this.configValidator.validate(yamlContent, target);
            if (formatError) return formatError;

            console.log('✅ 订阅处理完成');
            console.log('='.repeat(50) + '\n');
            
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
            console.error('❌ 处理订阅时出错:', error);
            
            // 使用自定义错误处理器
            if (error instanceof CustomError) {
                return ErrorHandler.createResponse(error);
            }
            
            // 对于未知错误，创建通用错误响应
            return ErrorHandler.createResponse(new CustomError(
                ErrorCode.SUBSCRIPTION_FETCH_FAILED,
                '订阅处理失败',
                500,
                { originalError: error instanceof Error ? error.message : String(error) }
            ));
        }
    }
    

} 