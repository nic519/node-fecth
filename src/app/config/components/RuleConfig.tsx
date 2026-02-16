import { UserConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import yaml from 'js-yaml';
import Editor from '@monaco-editor/react';

const DEFAULT_RULE_URL = 'https://raw.githubusercontent.com/zzy333444/passwall_rule/refs/heads/main/miho-cfg.yaml';
const MANDATORY_KEYWORDS = ["国外流量", "手动选择", "漏网之鱼", "自动"];

interface RuleConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
}

export function RuleConfig({ config, onChange, readOnly = false }: RuleConfigProps) {
    const handleChange = (key: keyof UserConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    // Filter Logic
    const [filterOptions, setFilterOptions] = useState<string[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [filterError, setFilterError] = useState<string | null>(null);
    const [enableCustomFilters, setEnableCustomFilters] = useState(!!config.requiredFilters);

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
    }, [enableCustomFilters, filterOptions, config.requiredFilters]);

    // Fetch filters
    useEffect(() => {
        const fetchFilters = async () => {
            setLoadingFilters(true);
            setFilterError(null);
            try {
                const url = config.ruleUrl || DEFAULT_RULE_URL;
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch rules');
                const text = await response.text();
                const data = yaml.load(text) as any;

                if (data && data['proxy-groups'] && Array.isArray(data['proxy-groups'])) {
                    const options = data['proxy-groups']
                        .map((g: any) => g.name)
                        .filter((n: string) => n);
                    // Remove duplicates just in case
                    setFilterOptions([...new Set(options)] as string[]);
                } else {
                    setFilterError('Invalid YAML format: missing proxy-groups');
                }
            } catch (err: any) {
                setFilterError(err.message || 'Error loading filters');
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

    const [yamlError, setYamlError] = useState<string | null>(null);

    const handleYamlChange = (value: string | undefined) => {
        const newValue = value || '';
        handleChange('ruleOverride', newValue);

        if (!newValue.trim()) {
            setYamlError(null);
            return;
        }

        try {
            yaml.load(newValue);
            setYamlError(null);
        } catch (err: any) {
            setYamlError(err.message || 'Invalid YAML format');
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="ruleUrl">规则 URL (Rule URL)</Label>
                <Input
                    id="ruleUrl"
                    value={config.ruleUrl || ''}
                    onChange={(e) => handleChange('ruleUrl', e.target.value)}
                    placeholder="https://raw.githubusercontent.com/..."
                    readOnly={readOnly}
                />
                <p className="text-sm text-muted-foreground">
                    可选。Clash 格式的过滤规则文件 URL。默认为 miho-cfg.yaml 的规则。
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="requiredFilters" className="text-base">需要的过滤项 (Required Filters)</Label>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="enable-filters"
                            checked={enableCustomFilters}
                            onCheckedChange={handleFilterToggle}
                            disabled={readOnly}
                        />
                        <Label htmlFor="enable-filters" className="text-sm font-normal text-muted-foreground">
                            {enableCustomFilters ? '已启用自定义过滤' : '默认包含所有 (Default All)'}
                        </Label>
                    </div>
                </div>

                {enableCustomFilters ? (
                    <div className="border rounded-md p-4 space-y-4 bg-background">
                        {loadingFilters ? (
                            <div className="flex items-center justify-center py-4 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                正在加载过滤选项...
                            </div>
                        ) : filterError ? (
                            <div className="text-destructive text-sm">
                                加载失败: {filterError}
                                <br />
                                <span className="text-xs text-muted-foreground">请检查规则 URL 是否正确且允许跨域访问。</span>
                            </div>
                        ) : filterOptions.length === 0 ? (
                            <div className="text-muted-foreground text-sm">未找到可用的过滤选项。</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                                    {filterOptions.map((option) => {
                                        const mandatory = isMandatory(option);
                                        const isChecked = mandatory || config.requiredFilters?.split(',').map(s => s.trim()).includes(option);

                                        return (
                                            <div key={option} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`filter-${option}`}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => !mandatory && handleFilterSelection(option, checked as boolean)}
                                                    disabled={readOnly || mandatory}
                                                />
                                                <Label
                                                    htmlFor={`filter-${option}`}
                                                    className={`text-sm font-normal cursor-pointer ${mandatory ? 'text-muted-foreground' : ''}`}
                                                >
                                                    {option}
                                                    {mandatory && <span className="ml-1 text-xs text-primary">(必选)</span>}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {(!config.requiredFilters || config.requiredFilters.length === 0) && (
                                    <p className="text-sm text-destructive font-medium">
                                        请至少选择一项，否则将无法生效 (视为未启用)。
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
                        未启用自定义过滤，将保留规则文件中的所有策略组。
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label>规则覆写 (Rule Override)</Label>
                <div className={`border rounded-md overflow-hidden ${yamlError ? 'border-destructive' : ''}`} style={{ minHeight: '300px' }}>
                    <Editor
                        height="300px"
                        defaultLanguage="yaml"
                        value={config.ruleOverride || ''}
                        onChange={handleYamlChange}
                        options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            readOnly: readOnly,
                            theme: 'vs-dark'
                        }}
                    />
                </div>
                {yamlError ? (
                    <p className="text-sm text-destructive font-medium">
                        YAML 格式错误: {yamlError}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        可选。在此处输入 YAML 格式的内容以覆写或追加规则。
                        <br />
                        <span className="text-xs opacity-80">注意：这将合并到生成的配置中，顶层字段将被替换。</span>
                    </p>
                )}
            </div>
        </div>
    );
}
