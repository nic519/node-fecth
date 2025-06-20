// 从Zod schema导入类型
export type { UserConfig, SubConfig, AreaCode } from '@/types/user-config.schema';

export interface UserConfigMeta {
	lastModified: string;
	source: 'kv' | 'env';
	userId: string;
}

// 前端特定的类型定义
export interface ConfigResponse {
	config: import('@/types/user-config.schema').UserConfig;
	meta: UserConfigMeta;
}
