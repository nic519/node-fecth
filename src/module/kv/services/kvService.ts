import { CommonUtils } from '@/utils/commonUtils';
import { ForwardingService } from '@/module/kv/services/forwardingService';
import { RoutesPath } from '@/routes/routesPath';

/**
 * KV存储服务
 * 统一处理本地和远程环境的KV操作
 */
export class KvService {
	constructor(private request: Request, private env: Env) {}

	/**
	 * KV GET操作
	 */
	async get(key: string, uid?: string, token?: string): Promise<string | null> {
		// 如果不是本地开发环境，直接使用KV
		if (!CommonUtils.isLocalEnv(this.request)) {
			return (await this.env.KV_BINDING?.get(key)) || null;
		}

		console.log(`🔄 本地开发环境 - 转发KV GET操作: ${key}`);

		// 构建转发参数
		const params: Record<string, string> = { key };
		if (uid) params.uid = uid;
		if (token) params.token = token;

		return await ForwardingService.forwardGet(RoutesPath.kv, params);
	}

	/**
	 * KV PUT操作
	 */
	async put(key: string, value: string, uid?: string, token?: string): Promise<void> {
		// 如果不是本地开发环境，直接使用KV
		if (!CommonUtils.isLocalEnv(this.request)) {
			await this.env.KV_BINDING?.put(key, value);
			return;
		}

		console.log(`🔄 本地开发环境 - 转发KV PUT操作: ${key}`);

		// 构建转发数据
		const data: Record<string, any> = { key, value };
		if (uid) data.uid = uid;
		if (token) data.token = token;

		await ForwardingService.forwardPost(RoutesPath.kv, data);
	}

	/**
	 * KV DELETE操作
	 */
	async delete(key: string, uid?: string, token?: string): Promise<void> {
		// 如果不是本地开发环境，直接使用KV
		if (!CommonUtils.isLocalEnv(this.request)) {
			await this.env.KV_BINDING?.delete(key);
			return;
		}

		console.log(`🔄 本地开发环境 - 转发KV DELETE操作: ${key}`);

		// 构建转发数据
		const data: Record<string, any> = { key, action: 'delete' };
		if (uid) data.uid = uid;
		if (token) data.token = token;

		await ForwardingService.forwardPost(RoutesPath.kv, data);
	}

	/**
	 * 检查环境并返回环境信息
	 */
	getEnvironmentInfo(): {
		isLocalDev: boolean;
		hasKvBinding: boolean;
		productionUrl?: string;
	} {
		const isLocalDev = CommonUtils.isLocalEnv(this.request);
		const hasKvBinding = !!this.env.KV_BINDING;

		let productionUrl: string | undefined;
		if (isLocalDev) {
			try {
				productionUrl = CommonUtils.getProdURI();
			} catch {
				// 忽略错误，productionUrl 保持 undefined
			}
		}

		return {
			isLocalDev,
			hasKvBinding,
			productionUrl,
		};
	}
}
