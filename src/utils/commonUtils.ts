export class CommonUtils {

    /**
     * 检测是否为本地开发环境
     */
    static isLocalDevelopment(env: Env): boolean {
        // 检查KV是否可用
        const kvAvailable = env.KV_BINDING && typeof env.KV_BINDING.get === 'function';
        console.log('🔍 环境检测:', {
            hasKvBinding: !!env.KV_BINDING,
            kvGetAvailable: !!(env.KV_BINDING && typeof env.KV_BINDING.get === 'function'),
            isLocalDev: !kvAvailable
        });
        return !kvAvailable;
    }
}