// ===================================================================
// 🚀 oazapfts 生成的类型安全 API 客户端 (Hono 最佳实践)
// ===================================================================
//
// 此文件由 oazapfts 基于 OpenAPI 规范自动生成，已自动解包装响应
// 直接返回业务层数据结构，无需手动处理 HTTP 状态码
//
// 期望的响应结构：
// {
//   code: 0,
//   msg: string,
//   data: { ... }
// }
//
// 使用方法：
// import { getHealth, defaults } from '@/generated/api-client';
//
// // 配置基础URL（如果需要）
// defaults.baseUrl = 'https://api.example.com';
//
// // 直接调用函数，自动解包装响应
// const result = await getHealth(); // 直接得到业务数据
//

/**
 * Node-Fetch API
 * 1.0.0
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from '@oazapfts/runtime';
import * as QS from '@oazapfts/runtime/query';
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
	headers: {},
	baseUrl: 'http://localhost:3000/api',
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
	'': 'http://localhost:8787',
};
/**
 * 健康检查
 */
export function getApiHealth(opts?: Oazapfts.RequestOpts) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			code: 0;
			msg: string;
			data: {
				/** 服务状态 */
				status: string;
				/** 检查时间 */
				timestamp: string;
			};
		};
	}>('/api/health', {
		...opts,
	});
}
/**
 * 更新用户配置
 */
export function postApiConfigUserUpdate(
	uid: string,
	token: string,
	body?: {
		config: {
			subscribe: string;
			accessToken: string;
			ruleUrl?: string;
			fileName?: string;
			multiPortMode?: ('TW' | 'SG' | 'JP' | 'VN' | 'HK' | 'US')[];
			appendSubList?: {
				subscribe: string;
				flag: string;
				includeArea?: ('TW' | 'SG' | 'JP' | 'VN' | 'HK' | 'US')[];
			}[];
			excludeRegex?: string;
		};
	},
	opts?: Oazapfts.RequestOpts,
) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			/** 响应代码：0=成功，其他=错误码 */
			code: number;
			/** 响应消息 */
			msg: string;
			/** 响应数据 */
			data?: any;
		};
	}>(
		`/api/user${QS.query(
			QS.explode({
				uid,
				token,
			}),
		)}`,
		oazapfts.json({
			...opts,
			method: 'POST',
			body,
		}),
	);
}
/**
 * 用户详情
 */
export function getApiConfigUserDetail(uid: string, token: string, opts?: Oazapfts.RequestOpts) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			/** 响应代码：0=成功，其他=错误码 */
			code: number;
			/** 响应消息 */
			msg: string;
			/** 响应数据 */
			data?: any;
		};
	}>(
		`/api/user${QS.query(
			QS.explode({
				uid,
				token,
			}),
		)}`,
		{
			...opts,
		},
	);
}
/**
 * 管理员删除用户
 */
export function adminDeleteUser(
	superToken: string,
	body?: {
		/** 用户ID */
		uid: string;
	},
	opts?: Oazapfts.RequestOpts,
) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			/** 响应代码：0=成功，其他=错误码 */
			code: number;
			/** 响应消息 */
			msg: string;
			/** 响应数据 */
			data?: any;
		};
	}>(
		`/api/admin/user/delete${QS.query(
			QS.explode({
				superToken,
			}),
		)}`,
		oazapfts.json({
			...opts,
			method: 'POST',
			body,
		}),
	);
}
/**
 * 创建新用户
 */
export function adminUserCreate(
	superToken: string,
	body?: {
		uid: string;
		config: {
			subscribe: string;
			accessToken: string;
			ruleUrl?: string;
			fileName?: string;
			multiPortMode?: ('TW' | 'SG' | 'JP' | 'VN' | 'HK' | 'US')[];
			appendSubList?: {
				subscribe: string;
				flag: string;
				includeArea?: ('TW' | 'SG' | 'JP' | 'VN' | 'HK' | 'US')[];
			}[];
			excludeRegex?: string;
		};
	},
	opts?: Oazapfts.RequestOpts,
) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			/** 响应代码：0=成功，其他=错误码 */
			code: number;
			/** 响应消息 */
			msg: string;
			/** 响应数据 */
			data?: any;
		};
	}>(
		`/api/admin/user/create${QS.query(
			QS.explode({
				superToken,
			}),
		)}`,
		oazapfts.json({
			...opts,
			method: 'POST',
			body,
		}),
	);
}
/**
 * 获取所有用户列表
 */
export function adminGetUsers(superToken: string, opts?: Oazapfts.RequestOpts) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			/** 响应代码：0=成功，其他=错误码 */
			code: number;
			/** 响应消息 */
			msg: string;
			/** 响应数据 */
			data?: any;
		};
	}>(
		`/api/admin/user/all${QS.query(
			QS.explode({
				superToken,
			}),
		)}`,
		{
			...opts,
		},
	);
}
/**
 * 存储内容获取操作
 */
export function getApiStorage(
	{
		action,
		key,
		token,
	}: {
		action?: string;
		key?: string;
		token?: string;
	} = {},
	opts?: Oazapfts.RequestOpts,
) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			/** 响应代码：0=成功，其他=错误码 */
			code: number;
			/** 响应消息 */
			msg: string;
			/** 响应数据 */
			data?: any;
		};
	}>(
		`/api/storage${QS.query(
			QS.explode({
				action,
				key,
				token,
			}),
		)}`,
		{
			...opts,
		},
	);
}
/**
 * KV 存储操作
 */
export function getApiKv(
	{
		key,
		$namespace,
		token,
	}: {
		key?: string;
		$namespace?: string;
		token?: string;
	} = {},
	opts?: Oazapfts.RequestOpts,
) {
	return oazapfts.fetchJson<{
		status: 200;
		data: {
			/** 响应代码：0=成功，其他=错误码 */
			code: number;
			/** 响应消息 */
			msg: string;
			/** 响应数据 */
			data?: any;
		};
	}>(
		`/api/kv${QS.query(
			QS.explode({
				key,
				namespace: $namespace,
				token,
			}),
		)}`,
		{
			...opts,
		},
	);
}
/**
 * 获取订阅配置
 */
export function getApiX(
	uid: string,
	token: string,
	{
		download,
	}: {
		download?: boolean | null;
	} = {},
	opts?: Oazapfts.RequestOpts,
) {
	return oazapfts.fetchJson<{
		status: 200;
		data: string;
	}>(
		`/api/x${QS.query(
			QS.explode({
				uid,
				token,
				download,
			}),
		)}`,
		{
			...opts,
		},
	);
}
