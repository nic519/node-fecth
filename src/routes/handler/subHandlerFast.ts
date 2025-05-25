import { RouteHandler } from '@/routes/types';
import { getUserConfig, RESPONSE_HEADERS, UserConfig } from '@/types/types';
import { ConfigValidator } from '@/module/configValidator'; 
import { ClashYamlMerge } from '@/module/clashYamlMerge';

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
        const userConfig = getUserConfig(env, uid);
        
        if (!userConfig || token !== userConfig.ACCESS_TOKEN) {
            console.log('❌ Token验证失败');
            return new Response('Unauthorized', { status: 401 });
        }
        
        console.log('✅ Token验证通过');
        console.log('📋 用户配置:', JSON.stringify(userConfig, null, 2));
        
        try {
            // 处理订阅逻辑
            console.log('🎯 开始处理订阅...');
            
            const target = url.searchParams.get('target') || 'clash';
            console.log(`🎯 目标格式: ${target}`);
        
            const clashYamlMerge = new ClashYamlMerge(env, request, userConfig.SUB_URL!, userConfig.RULE_URL!, token, uid);
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
                    'Content-Disposition': `attachment; filename=${userConfig.FILE_NAME}.${target === 'clash' ? 'yaml' : 'json'}`
                }
            });
            
        } catch (error) {
            console.error('❌ 处理订阅时出错:', error);
            return new Response('Internal Server Error', { status: 500 });
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
        console.log('🔐 开始验证Token...');
        console.log(`   用户ID: "${uid}"`);
        console.log(`   Token: "${token}"`);
        
        if (!uid || !token) {
            console.log('❌ 缺少uid或token');
            return new Response('Unauthorized', { status: 401 });
        }
        
        console.log('📋 获取用户配置...');
        const userConfig = getUserConfig(env, uid);
        
        if (!userConfig) {
            console.log(`❌ 用户 "${uid}" 的配置不存在`);
            console.log('📝 检查.dev.vars中的USER_CONFIGS配置');
            return new Response('Unauthorized', { status: 401 });
        }
        
        console.log(`📄 找到用户配置: ${JSON.stringify(userConfig, null, 2)}`);
        console.log(`🔍 Token比较:`);
        console.log(`   期望: "${userConfig.ACCESS_TOKEN}"`);
        console.log(`   实际: "${token}"`);
        console.log(`   匹配: ${token === userConfig.ACCESS_TOKEN}`);
        
        if (token !== userConfig.ACCESS_TOKEN) {
            console.log('❌ Token不匹配');
            return new Response('Unauthorized', { status: 401 });
        }
        
        console.log('✅ Token验证通过');
        return userConfig;
    }
} 