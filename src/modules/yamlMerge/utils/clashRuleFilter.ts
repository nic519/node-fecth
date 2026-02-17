import type { YamlObject, YamlValue } from '@/modules/yamlMerge/utils/yamlTypes';

type ProxyLike = {
    name?: string;
};

type ProxyGroupLike = {
    name?: string;
    proxies?: string[];
};

/**
 * Clash 规则过滤器类
 * 用于根据指定的关键词过滤 Proxy Group 和 Rules
 */
export class ClashRuleFilter {
    /**
     * 过滤 Proxy Groups
     * @param yamlObj Clash 配置文件对象
     * @param requiredFilters 逗号分隔的过滤关键词字符串
     * @returns 返回保留的组名集合和所有节点名称集合
     */
    static filterProxyGroups(yamlObj: YamlObject, requiredFilters: string): { keptGroupNames: Set<string>, allNodeNames: Set<string> } {
        const result = {
            keptGroupNames: new Set<string>(), // 存储需要保留的策略组名称
            allNodeNames: new Set<string>(),   // 存储所有代理节点的名称
        };

        if (typeof yamlObj !== 'object' || yamlObj === null) return result;

        // 解析过滤关键词，移除空项
        const filters = requiredFilters.split(',').map((f) => f.trim()).filter(Boolean);
        if (filters.length === 0) return result;

        // 1. 收集所有代理节点 (proxies) 的名称
        const proxies = yamlObj['proxies'];
        if (Array.isArray(proxies)) {
            (proxies as ProxyLike[]).forEach((p) => {
                if (p.name) result.allNodeNames.add(p.name);
            });
        }

        // 2. 建立策略组 (proxy-groups) 的映射以便查找
        const groupMap = new Map<string, ProxyGroupLike>();
        const proxyGroups = yamlObj['proxy-groups'];
        if (Array.isArray(proxyGroups)) {
            (proxyGroups as ProxyGroupLike[]).forEach((g) => {
                if (g.name) groupMap.set(g.name, g);
            });
        }

        // 3. 初始筛选：找出名字中包含过滤关键词的策略组
        const processingQueue: string[] = [];
        groupMap.forEach((group, name) => {
            if (filters.some((f) => name.includes(f))) {
                result.keptGroupNames.add(name);
                processingQueue.push(name);
            }
        });

        // 4. 递归筛选：如果保留的组引用了其他组或节点，那些被引用的也需要保留（这里主要处理组引用组的情况，或者收集被引用的节点）
        while (processingQueue.length > 0) {
            const currentName = processingQueue.shift()!;
            const group = groupMap.get(currentName);
            if (!group || !Array.isArray(group.proxies)) continue;

            group.proxies.forEach((proxyName) => {
                // 如果引用的 proxyName 是一个策略组，且尚未被保留，则加入保留列表和处理队列
                if (groupMap.has(proxyName) && !result.keptGroupNames.has(proxyName)) {
                    result.keptGroupNames.add(proxyName);
                    processingQueue.push(proxyName);
                }
            });
        }

        // 5. 更新 yamlObj 中的 proxy-groups，只保留在 keptGroupNames 中的组
        if (Array.isArray(proxyGroups)) {
            yamlObj['proxy-groups'] = (proxyGroups as ProxyGroupLike[]).filter((group) => {
                return group.name !== undefined && result.keptGroupNames.has(group.name);
            }) as YamlValue;
        }

        // 6. 清理保留下来的策略组中的 proxies 列表
        // 移除那些既不是有效节点，也不是保留组，也不是内置策略（DIRECT/REJECT等）的引用
        const updatedGroups = yamlObj['proxy-groups'];
        if (Array.isArray(updatedGroups)) {
            (updatedGroups as ProxyGroupLike[]).forEach((group) => {
                if (Array.isArray(group.proxies)) {
                    group.proxies = group.proxies.filter((proxyName) => {
                        if (result.allNodeNames.has(proxyName)) return true; // 是已知节点
                        if (result.keptGroupNames.has(proxyName)) return true; // 是保留的策略组
                        if (['DIRECT', 'REJECT', 'no-resolve'].includes(proxyName)) return true; // 是内置策略
                        return false; // 其他无效引用移除
                    });

                    // 如果过滤后该组为空，默认添加 DIRECT 防止报错
                    if (group.proxies.length === 0) {
                        group.proxies.push('DIRECT');
                    }
                }
            });
        }

        return result;
    }

    /**
     * 过滤 Rules
     * @param yamlObj Clash 配置文件对象
     * @param keptGroupNames 保留的策略组名称集合
     * @param allNodeNames 所有节点名称集合
     */
    static filterRules(yamlObj: YamlObject, keptGroupNames: Set<string>, allNodeNames: Set<string>) {
        const rules = yamlObj['rules'];
        if (!Array.isArray(rules)) return;

        const validPolicies = new Set(['DIRECT', 'REJECT', 'no-resolve']);

        // 过滤规则列表
        yamlObj['rules'] = (rules as YamlValue[]).filter((rule) => {
            if (typeof rule !== 'string') return false;

            const parts = rule.split(',');
            if (parts.length < 2) return false;

            let policy = '';
            // 处理 MATCH 规则和其他规则
            // 格式通常为 TYPE,ARG,POLICY 或 MATCH,POLICY
            if (parts[0].toUpperCase() === 'MATCH') {
                policy = parts[1];
            } else {
                if (parts.length >= 3) {
                    policy = parts[2];
                } else {
                    return false; // 格式不正确
                }
            }

            policy = policy.trim();

            // 检查策略是否有效：是内置策略、保留的组、或已知节点
            if (validPolicies.has(policy)) return true;
            if (keptGroupNames.has(policy)) return true;
            if (allNodeNames.has(policy)) return true;

            return false;
        }) as YamlValue;
    }
}
