/**
 * KV存储服务
 * 纯粹的KV操作，不包含转发逻辑
 */
export class KvService {
	constructor(private env: Env) {}

	/**
	 * KV GET操作
	 */
	async get(key: string): Promise<string | null> {
		return (await this.env.KV_BINDING?.get(key)) || null;
	}

	/**
	 * KV PUT操作
	 */
	async put(key: string, value: string): Promise<void> {
		await this.env.KV_BINDING?.put(key, value);
	}

	/**
	 * KV DELETE操作
	 */
	async delete(key: string): Promise<void> {
		await this.env.KV_BINDING?.delete(key);
	}
}
