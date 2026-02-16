
import { UserConfig, SubConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface ConfigFormProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
}

const AREA_CODES = ['TW', 'SG', 'JP', 'VN', 'HK', 'US'];

export function ConfigForm({ config, onChange, readOnly = false }: ConfigFormProps) {
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

    return (
        <div className="space-y-6 p-6">
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
                <Label htmlFor="requiredFilters">需要的过滤项 (Required Filters)</Label>
                <Input
                    id="requiredFilters"
                    value={config.requiredFilters || ''}
                    onChange={(e) => handleChange('requiredFilters', e.target.value)}
                    placeholder="[单]-Facebook👥, [单]-LinkedIn👥"
                    readOnly={readOnly}
                />
                <p className="text-sm text-muted-foreground">
                    可选。根据 ruleUrl 的 proxy-groups 得出，用逗号隔开。
                </p>
            </div>

            {/* <div className="space-y-2">
                <Label>多端口模式 (Multi-Port Mode)</Label>
                <div className="flex flex-wrap gap-4">
                    {AREA_CODES.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`mode-${area}`}
                                checked={config.multiPortMode?.includes(area as any) || false}
                                onChange={(e) => handleMultiPortModeChange(area, e.target.checked)}
                                disabled={readOnly}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={`mode-${area}`}>{area}</Label>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground">可选。选择需要启用的地区节点。</p>
            </div> */}

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
        </div>
    );
}
