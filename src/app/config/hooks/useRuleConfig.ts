import { useState, useEffect, useCallback } from 'react';
import yaml from 'js-yaml';
import { UserConfig } from '@/types/openapi-schemas';

const DEFAULT_RULE_URL = 'https://raw.githubusercontent.com/zzy333444/passwall_rule/refs/heads/main/miho-cfg.yaml';
const MANDATORY_KEYWORDS = ["国外流量", "手动选择", "漏网之鱼", "自动"];

interface UseRuleConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
}

export function useRuleConfig({ config, onChange }: UseRuleConfigProps) {
    const [filterOptions, setFilterOptions] = useState<string[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [filterError, setFilterError] = useState<string | null>(null);
    const [enableCustomFilters, setEnableCustomFilters] = useState(!!config.requiredFilters);
    const [yamlError, setYamlError] = useState<string | null>(null);

    const handleChange = useCallback(<K extends keyof UserConfig>(key: K, value: UserConfig[K]) => {
        onChange({ ...config, [key]: value });
    }, [config, onChange]);

    const isMandatory = (option: string) => {
        return MANDATORY_KEYWORDS.some(keyword => option.includes(keyword));
    };

    // Sync enable state with config
    useEffect(() => {
        if (config.requiredFilters) {
            setEnableCustomFilters(true);
        }
    }, [config.requiredFilters]);

    // Ensure mandatory filters are selected when options are available and filters are enabled
    useEffect(() => {
        if (enableCustomFilters && filterOptions.length > 0) {
            const currentFilters = config.requiredFilters ? config.requiredFilters.split(',').map(s => s.trim()) : [];
            const mandatoryFilters = filterOptions.filter(isMandatory);

            const missingMandatory = mandatoryFilters.filter(m => !currentFilters.includes(m));

            if (missingMandatory.length > 0) {
                const newFilters = [...currentFilters, ...missingMandatory];
                handleChange('requiredFilters', newFilters.join(','));
            }
        }
    }, [enableCustomFilters, filterOptions, config.requiredFilters, handleChange]);

    // Fetch filters
    useEffect(() => {
        const fetchFilters = async () => {
            setLoadingFilters(true);
            setFilterError(null);
            try {
                const url = config.ruleUrl || DEFAULT_RULE_URL;
                const response = await fetch(url);
                if (!response.ok) throw new Error('获取规则失败');
                const text = await response.text();
                const data = yaml.load(text) as unknown;

                if (data && typeof data === 'object' && 'proxy-groups' in data && Array.isArray((data as { ['proxy-groups']?: unknown })['proxy-groups'])) {
                    const proxyGroups = (data as { ['proxy-groups']?: { name?: string }[] })['proxy-groups'] ?? [];
                    const options = proxyGroups
                        .map((g) => g.name)
                        .filter((n): n is string => !!n);
                    // Remove duplicates just in case
                    setFilterOptions([...new Set(options)] as string[]);
                } else {
                    setFilterError('YAML 格式错误: 缺少 proxy-groups');
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : '加载过滤选项出错';
                setFilterError(message);
                console.error(err);
            } finally {
                setLoadingFilters(false);
            }
        };

        fetchFilters();
    }, [config.ruleUrl]);

    const handleFilterToggle = (checked: boolean) => {
        setEnableCustomFilters(checked);
        if (!checked) {
            handleChange('requiredFilters', '');
        }
    };

    const handleFilterSelection = (option: string, checked: boolean) => {
        const current = config.requiredFilters ? config.requiredFilters.split(',').map(s => s.trim()).filter(s => s) : [];
        let newFilters;
        if (checked) {
            newFilters = [...current, option];
        } else {
            newFilters = current.filter(f => f !== option);
        }
        handleChange('requiredFilters', newFilters.join(','));
    };

    const handleYamlChange = (value: string | undefined) => {
        const newValue = value || '';
        handleChange('ruleOverwrite', newValue);

        if (!newValue.trim()) {
            setYamlError(null);
            return;
        }

        try {
            yaml.load(newValue);
            setYamlError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '无效的 YAML 格式';
            setYamlError(message);
        }
    };

    return {
        filterOptions,
        loadingFilters,
        filterError,
        enableCustomFilters,
        yamlError,
        isMandatory,
        handleChange,
        handleFilterToggle,
        handleFilterSelection,
        handleYamlChange
    };
}
