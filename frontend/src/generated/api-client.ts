
// ===================================================================
// 🚀 完全动态生成的 API 客户端
// ===================================================================
// 
// 所有API方法都基于OpenAPI规范自动生成，新增接口会自动包含
// 
// 使用方法：
// import { getHealth, postConfigUserUpdateByUid, defaults } from '@/generated/api-client';
// 
// // 配置基础URL和认证
// defaults.baseUrl = 'https://api.example.com';
// defaults.headers.Authorization = 'Bearer your-token';
// 
// // 直接调用生成的方法
// const health = await getHealth();
// const result = await postConfigUserUpdateByUid('uid', 'token', { config: {...} });
//
/**
 * Node-Fetch API
 * 1.0.0
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
import * as QS from "@oazapfts/runtime/query";
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
    headers: {},
    baseUrl: (globalThis as any)?.import?.meta?.env?.VITE_API_BASE_URL || "http://localhost:8787",
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    "": "http://localhost:8787"
};
/**
 * 健康检查
 */
export function getHealth(opts?: Oazapfts.RequestOpts) {
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
    }>("/health", {
        ...opts
    });
}
/**
 * 更新用户配置
 */
export function postConfigUserUpdateByUid(uid: string, token: string, body?: {
    config: {
        subscribe: string;
        accessToken: string;
        ruleUrl?: string;
        fileName?: string;
        multiPortMode?: ("TW" | "SG" | "JP" | "VN" | "HK" | "US")[];
        appendSubList?: {
            subscribe: string;
            flag: string;
            includeArea?: ("TW" | "SG" | "JP" | "VN" | "HK" | "US")[];
        }[];
        excludeRegex?: string;
    };
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: {
            code: 0;
            msg: string;
            data?: any;
        };
    } | {
        status: 400;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>(`/config/user/update/${encodeURIComponent(uid)}${QS.query(QS.explode({
        token
    }))}`, oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * 用户详情
 */
export function getConfigUserDetailByUid(uid: string, token: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: {
            code: 0;
            msg: string;
            data: {
                config: {
                    subscribe: string;
                    accessToken: string;
                    ruleUrl?: string;
                    fileName?: string;
                    multiPortMode?: ("TW" | "SG" | "JP" | "VN" | "HK" | "US")[];
                    appendSubList?: {
                        subscribe: string;
                        flag: string;
                        includeArea?: ("TW" | "SG" | "JP" | "VN" | "HK" | "US")[];
                    }[];
                    excludeRegex?: string;
                };
                meta: {
                    lastModified: string;
                    source: "kv" | "env";
                    uid: string;
                };
            };
        };
    } | {
        status: 400;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>(`/config/user/detail/${encodeURIComponent(uid)}${QS.query(QS.explode({
        token
    }))}`, {
        ...opts
    });
}
/**
 * 管理员删除用户
 */
export function getAdminUserDeleteByUid(uid: string, superToken: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: {
            code: 0;
            msg: string;
            data?: any;
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 404;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>(`/admin/user/delete/${encodeURIComponent(uid)}${QS.query(QS.explode({
        superToken
    }))}`, {
        ...opts
    });
}
/**
 * 创建新用户
 */
export function postAdminUserCreate(body?: {
    uid: string;
    config: {
        subscribe: string;
        accessToken: string;
        ruleUrl?: string;
        fileName?: string;
        multiPortMode?: ("TW" | "SG" | "JP" | "VN" | "HK" | "US")[];
        appendSubList?: {
            subscribe: string;
            flag: string;
            includeArea?: ("TW" | "SG" | "JP" | "VN" | "HK" | "US")[];
        }[];
        excludeRegex?: string;
    };
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
        data: {
            code: 0;
            msg: string;
            data?: any;
        };
    } | {
        status: 400;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 409;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>("/admin/user/create", oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * 获取所有用户列表
 */
export function getAdminUserAll(superToken: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: {
            code: 0;
            msg: string;
            data: {
                users: {
                    uid: string;
                    token: string;
                    hasConfig: boolean;
                    source: "kv" | "env" | "none";
                    lastModified: string | null;
                    isActive: boolean;
                    subscribeUrl?: string;
                    status: "active" | "inactive" | "disabled";
                    trafficInfo?: {
                        upload: number;
                        download: number;
                        total: number;
                        used: number;
                        remaining: number;
                        expire?: number;
                        isExpired: boolean;
                        usagePercent: number;
                    };
                }[];
                count: number;
                timestamp: string;
            };
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>(`/admin/user/all${QS.query(QS.explode({
        superToken
    }))}`, {
        ...opts
    });
}
/**
 * 存储内容获取操作
 */
export function getStorage({ action, key, token }: {
    action?: string;
    key?: string;
    token?: string;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: {};
    } | {
        status: 400;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>(`/storage${QS.query(QS.explode({
        action,
        key,
        token
    }))}`, {
        ...opts
    });
}
/**
 * KV 存储操作
 */
export function getKv({ key, $namespace, token }: {
    key?: string;
    $namespace?: string;
    token?: string;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: {
            /** 存储的数据 */
            data?: any;
            /** 存储键 */
            key?: string;
            /** 命名空间 */
            "namespace"?: string;
        };
    } | {
        status: 400;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>(`/kv${QS.query(QS.explode({
        key,
        "namespace": $namespace,
        token
    }))}`, {
        ...opts
    });
}
/**
 * 获取订阅配置
 */
export function getByUid(uid: string, token: string, { $type, udp, download }: {
    $type?: "clash" | "v2ray" | "ss";
    udp?: boolean;
    download?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: string;
    } | {
        status: 400;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    } | {
        status: 401;
        data: {
            code: number;
            msg: string;
            data?: any;
        };
    }>(`/${encodeURIComponent(uid)}${QS.query(QS.explode({
        token,
        "type": $type,
        udp,
        download
    }))}`, {
        ...opts
    });
}
