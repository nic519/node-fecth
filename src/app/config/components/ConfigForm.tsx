
import { UserConfig, SubConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import yaml from 'js-yaml';

import { DynamicSyncPanel } from './DynamicSyncPanel';

export type ConfigTab = 'basic' | 'rules' | 'dynamic' | 'token' | 'preview';

const DEFAULT_RULE_URL = 'https://raw.githubusercontent.com/zzy333444/passwall_rule/refs/heads/main/miho-cfg.yaml';
const MANDATORY_KEYWORDS = ["国外流量", "手动选择", "漏网之鱼", "自动"];

interface ConfigFormProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    activeTab: ConfigTab;
}

const AREA_CODES = ['TW', 'SG', 'JP', 'VN', 'HK', 'US'];

export function ConfigForm({ config, onChange, readOnly = false, activeTab }: ConfigFormProps) {
    const handleChange = (key: keyof UserConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const handleMultiPortModeChange = (area: string, checked: boolean) => {
        const current = config.multiPortMode || [];
        let newMode;
        if (checked) {
            newMode = [...current, area];
        } else {
            newMode = current.filter((a) => a !== area);
        }
        handleChange('multiPortMode', newMode);
    };

    const handleAppendSubListAdd = () => {
        const currentList = config.appendSubList || [];
        const newItem: SubConfig = {
            subscribe: '',
            flag: '',
            includeArea: []
        };
        handleChange('appendSubList', [...currentList, newItem]);
    };

    const handleAppendSubListRemove = (index: number) => {
        const currentList = config.appendSubList || [];
        const newList = currentList.filter((_, i) => i !== index);
        handleChange('appendSubList', newList);
    };

    const handleAppendSubListUpdate = (index: number, field: keyof SubConfig, value: any) => {
        const currentList = config.appendSubList || [];
        const newList = [...currentList];
        newList[index] = { ...newList[index], [field]: value };
        handleChange('appendSubList', newList);
    };

    const handleAppendSubListAreaChange = (index: number, area: string, checked: boolean) => {
        const currentList = config.appendSubList || [];
        const item = currentList[index];
        const currentAreas = item.includeArea || [];
        let newAreas;
        if (checked) {
            newAreas = [...currentAreas, area];
        } else {
            newAreas = currentAreas.filter((a: string) => a !== area);
        }
        handleAppendSubListUpdate(index, 'includeArea', newAreas);
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
                // Use a timeout to avoid immediate state update conflicts if this runs during render
                // But useEffect runs after render.
                // We need to be careful not to cause infinite loops. 
                // We checked `missingMandatory.length > 0`, so it should stabilize.
                handleChange('requiredFilters', newFilters.join(','));
            }
        }
    }, [enableCustomFilters, filterOptions, config.requiredFilters]);

    // Fetch filters
    useEffect(() => {
        if (activeTab === 'rules') {
            const fetchFilters = async () => {
                // If we already have options and URL hasn't changed, maybe skip? 
                // But URL might change.
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
        }
    }, [activeTab, config.ruleUrl]);

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

    return (
        <div className="space-y-6 p-6">
            {activeTab === 'basic' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="subscribe">订阅地址 (Subscribe URL)</Label>
                        <Input
                            id="subscribe"
                            value={config.subscribe || ''}
                            onChange={(e) => handleChange('subscribe', e.target.value)}
                            placeholder="https://example.com/subscription"
                            readOnly={readOnly}
                        />
                        <p className="text-sm text-muted-foreground">必填。您的机场订阅链接。</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fileName">文件名 (File Name)</Label>
                        <Input
                            id="fileName"
                            value={config.fileName || ''}
                            onChange={(e) => handleChange('fileName', e.target.value)}
                            placeholder="miho-cfg.yaml"
                            readOnly={readOnly}
                        />
                        <p className="text-sm text-muted-foreground">
                            可选。生成的配置文件名，默认为 miho-cfg.yaml。
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="excludeRegex">排除正则 (Exclude Regex)</Label>
                        <Input
                            id="excludeRegex"
                            value={config.excludeRegex || ''}
                            onChange={(e) => handleChange('excludeRegex', e.target.value)}
                            placeholder=".*test.*"
                            readOnly={readOnly}
                        />
                        <p className="text-sm text-muted-foreground">
                            可选。用于排除不需要的节点的正则表达式。
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">追加订阅列表 (Append Sub List)</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAppendSubListAdd}
                                disabled={readOnly}
                                className="flex items-center gap-1"
                            >
                                <PlusIcon className="w-4 h-4" />
                                添加订阅
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {(!config.appendSubList || config.appendSubList.length === 0) && (
                                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                    暂无追加订阅
                                </div>
                            )}

                            {config.appendSubList?.map((item, index) => (
                                <Card key={index} className="relative overflow-hidden border-l-4 border-l-primary/20">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="absolute top-2 right-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleAppendSubListRemove(index)}
                                                disabled={readOnly}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`sub-url-${index}`}>订阅链接 (Subscribe URL)</Label>
                                                <Input
                                                    id={`sub-url-${index}`}
                                                    value={item.subscribe}
                                                    onChange={(e) => handleAppendSubListUpdate(index, 'subscribe', e.target.value)}
                                                    placeholder="https://example.com/sub"
                                                    readOnly={readOnly}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`sub-flag-${index}`}>标识 (Flag)</Label>
                                                <Input
                                                    id={`sub-flag-${index}`}
                                                    value={item.flag}
                                                    onChange={(e) => handleAppendSubListUpdate(index, 'flag', e.target.value)}
                                                    placeholder="sub-1"
                                                    readOnly={readOnly}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>包含地区 (Include Area)</Label>
                                            <div className="flex flex-wrap gap-4">
                                                {AREA_CODES.map((area) => (
                                                    <div key={`${index}-${area}`} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`sub-${index}-area-${area}`}
                                                            checked={item.includeArea?.includes(area as any) || false}
                                                            onChange={(e) => handleAppendSubListAreaChange(index, area, e.target.checked)}
                                                            disabled={readOnly}
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <Label htmlFor={`sub-${index}-area-${area}`}>{area}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground">可选。若不选则默认包含所有地区。</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            可选。配置额外的订阅源，可以合并多个机场的节点。
                        </p>
                    </div>
                </>
            )}

            {activeTab === 'rules' && (
                <>
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
                            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md bg-muted/50">
                                自定义过滤已禁用。将保留规则文件中的所有代理组。
                            </div>
                        )}

                        <p className="text-sm text-muted-foreground">
                            可选。根据 ruleUrl 的 proxy-groups 得出。启用后需手动勾选保留的组。
                        </p>
                    </div>
                </>
            )}

            {activeTab === 'dynamic' && (
                <DynamicSyncPanel config={config} />
            )}

            {activeTab === 'token' && (
                <div className="space-y-2">
                    <Label htmlFor="accessToken">访问令牌 (Access Token)</Label>
                    <Input
                        id="accessToken"
                        value={config.accessToken || ''}
                        onChange={(e) => handleChange('accessToken', e.target.value)}
                        placeholder="your-access-token"
                        readOnly={readOnly}
                    />
                    <p className="text-sm text-muted-foreground">必填。用于访问配置的唯一令牌。</p>
                </div>
            )}
        </div>
    );
}
