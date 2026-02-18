import yaml from 'js-yaml';
import type { YamlObject, YamlValue } from '@/modules/yamlMerge/utils/yamlTypes';

/**
 * Clash 规则覆盖类
 * 用于将自定义的配置片段（Override）合并到原有的 Clash 配置中
 */
export class ClashRuleOverride {
    /**
     * 应用规则覆盖
     * @param yamlObj 原始的 Clash 配置对象
     * @param ruleOverwrite 用户提供的覆盖规则字符串（YAML格式）
     */
    static applyRuleOverwrite(yamlObj: YamlObject, ruleOverwrite: string) {
        try {
            // 解析覆盖规则字符串
            const overwriteObj = yaml.load(ruleOverwrite);
            // 确保解析结果是对象且不是数组
            if (overwriteObj && typeof overwriteObj === 'object' && !Array.isArray(overwriteObj)) {
                ClashRuleOverride.applyClashOverride(yamlObj, overwriteObj as YamlObject);
            }
        } catch (e) {
            console.error('Failed to parse ruleOverwrite:', e);
        }
    }

    /**
     * 递归应用 Clash 覆盖逻辑
     * 支持特殊的键名后缀来控制合并行为：
     * - key! : 强制覆盖 (force)
     * - +key : 数组前插 (prepend)
     * - key+ : 数组后追 (append)
     * - <key>: 键名解包 (去除尖括号)
     * @param target 目标对象（原配置）
     * @param source 源对象（覆盖配置）
     */
    private static applyClashOverride(target: YamlObject, source: YamlObject) {
        if (!source || typeof source !== 'object') return;
        if (!target || typeof target !== 'object') return;

        for (const key of Object.keys(source)) {
            const value = source[key];
            let mode: 'normal' | 'force' | 'prepend' | 'append' = 'normal';
            let realKey = key;

            // 解析键名中的操作符
            if (realKey.endsWith('!')) {
                mode = 'force';
                realKey = realKey.slice(0, -1);
            } else if (realKey.startsWith('+')) {
                mode = 'prepend';
                realKey = realKey.slice(1);
            } else if (realKey.endsWith('+')) {
                mode = 'append';
                realKey = realKey.slice(0, -1);
            }

            // 处理 <key> 格式，去除尖括号
            if (realKey.startsWith('<') && realKey.endsWith('>')) {
                realKey = realKey.slice(1, -1);
            }

            // 根据模式执行合并
            if (mode === 'force') {
                // 强制覆盖模式：直接替换值
                target[realKey] = value;
            } else if (mode === 'prepend') {
                // 前插模式：用于数组，将新值插入到数组头部
                if (!Array.isArray(target[realKey])) target[realKey] = [];
                if (Array.isArray(value)) {
                    (target[realKey] as YamlValue[]).unshift(...value);
                } else {
                    (target[realKey] as YamlValue[]).unshift(value);
                }
            } else if (mode === 'append') {
                // 后追加模式：用于数组，将新值追加到数组尾部
                if (!Array.isArray(target[realKey])) target[realKey] = [];
                if (Array.isArray(value)) {
                    (target[realKey] as YamlValue[]).push(...value);
                } else {
                    (target[realKey] as YamlValue[]).push(value);
                }
            } else {
                // 普通模式
                if (target[realKey] && typeof target[realKey] === 'object' && !Array.isArray(target[realKey]) &&
                    value && typeof value === 'object' && !Array.isArray(value)) {
                    // 如果双方都是对象，则递归合并
                    ClashRuleOverride.applyClashOverride(target[realKey] as YamlObject, value as YamlObject);
                } else {
                    // 否则直接覆盖
                    target[realKey] = value;
                }
            }
        }
    }
}
