export class TrafficUtils {

    // 从原始地址获取clash的剩余流量信息
    static async fetchRemote(clashSubUrl: string): Promise<string> {
        // 并发执行两个fetch请求
        const responseClash = await fetch(clashSubUrl, {
            headers: {
            'User-Agent': 'clash 1.10.0'
            }
        });
        const subInfo = responseClash.headers.get('subscription-userinfo') || ''; 
        return subInfo;
    }
}