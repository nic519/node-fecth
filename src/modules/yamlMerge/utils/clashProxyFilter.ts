import type { YamlObject, YamlValue } from '@/modules/yamlMerge/utils/yamlTypes';

type ProxyLike = {
    name?: string;
    type?: string;
};

/**
 * Clash 代理节点过滤器类
 * 用于根据 excludeRegex 过滤 Proxies，并清理关联的 Group 和 Rules
 */
export class ClashProxyFilter {
    /**
     * 根据正则排除代理节点
     * @param yamlObj Clash 配置文件对象
     * @param excludeRegex 排除正则字符串
     */
    static filterByRegex(yamlObj: YamlObject, excludeRegex: string): void {
        if (!excludeRegex || typeof yamlObj !== 'object' || yamlObj === null) return;

        let regex: RegExp;
        try {
            regex = new RegExp(excludeRegex, 'i');
        } catch (e) {
            console.error('Invalid excludeRegex:', excludeRegex, e);
            return;
        }

        const removedProxyNames = new Set<string>();

        // 1. 过滤 proxies 列表
        const proxies = yamlObj['proxies'];
        if (Array.isArray(proxies)) {
            yamlObj['proxies'] = (proxies as ProxyLike[]).filter((p) => {
                if (!p.name) return false;

                if (regex.test(p.name)) {
                    removedProxyNames.add(p.name);
                    return false;
                }

                return true;
            }) as YamlValue;
        }
    }

    /**
     * 根据类型排除代理节点
     * @param yamlObj Clash 配置文件对象
     * @param typeToRemove 要移除的代理类型（不区分大小写）
     */
    static filterByType(yamlObj: YamlObject, typeToRemove: string): void {
        if (!typeToRemove || typeof yamlObj !== 'object' || yamlObj === null) return;

        const targetType = typeToRemove.toLowerCase();
        const removedProxyNames = new Set<string>();

        // 1. 过滤 proxies 列表
        const proxies = yamlObj['proxies'];
        if (Array.isArray(proxies)) {
            yamlObj['proxies'] = (proxies as ProxyLike[]).filter((p) => {
                if (!p.name) return false;

                if (p.type && p.type.toLowerCase() === targetType) {
                    removedProxyNames.add(p.name);
                    return false;
                }

                return true;
            }) as YamlValue;
        }
    }
}
