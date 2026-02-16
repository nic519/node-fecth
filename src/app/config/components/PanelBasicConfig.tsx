import { UserConfig, SubConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@heroicons/react/24/outline';
import { getRandomEmoji } from '@/utils/emojiUtils';
import { useCallback } from 'react';
import { SubConfigCard } from './SubConfigCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BasicConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
}

export function PanelBasicConfig({ config, onChange, readOnly = false }: BasicConfigProps) {
    const handleChange = useCallback((key: keyof UserConfig, value: any) => {
        onChange({ ...config, [key]: value });
    }, [config, onChange]);

    const handleAppendSubListAdd = useCallback(() => {
        const currentList = config.appendSubList || [];
        const newItem: SubConfig = {
            subscribe: '',
            flag: getRandomEmoji(),
            includeArea: []
        };
        handleChange('appendSubList', [...currentList, newItem]);
    }, [config.appendSubList, handleChange]);

    const handleAppendSubListRemove = useCallback((index: number) => {
        const currentList = config.appendSubList || [];
        const newList = currentList.filter((_, i) => i !== index);
        handleChange('appendSubList', newList);
    }, [config.appendSubList, handleChange]);

    const handleAppendSubListUpdate = useCallback((index: number, field: keyof SubConfig, value: any) => {
        const currentList = config.appendSubList || [];
        const newList = [...currentList];
        newList[index] = { ...newList[index], [field]: value };
        handleChange('appendSubList', newList);
    }, [config.appendSubList, handleChange]);

    const handleAppendSubListAreaChange = useCallback((index: number, area: string, checked: boolean) => {
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
    }, [config.appendSubList, handleAppendSubListUpdate]);

    return (
        <div className="space-y-8">
            {/* Main Configuration Section */}
            <Card>
                <CardHeader>
                    <CardTitle>基础设置</CardTitle>
                    <CardDescription>配置主订阅链接和全局选项</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="subscribe" className="text-base">主订阅地址</Label>
                        <Input
                            id="subscribe"
                            value={config.subscribe || ''}
                            onChange={(e) => handleChange('subscribe', e.target.value)}
                            placeholder="https://example.com/subscription"
                            readOnly={readOnly}
                            className="font-mono"
                        />
                        <p className="text-sm text-muted-foreground">
                            必填。您的主要机场订阅链接，将作为配置的基础。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="fileName">输出文件名</Label>
                            <Input
                                id="fileName"
                                value={config.fileName || ''}
                                onChange={(e) => handleChange('fileName', e.target.value)}
                                placeholder="miho-cfg.yaml"
                                readOnly={readOnly}
                            />
                            <p className="text-xs text-muted-foreground">
                                生成的配置文件名 (默认为 miho-cfg.yaml)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excludeRegex">节点排除正则</Label>
                            <Input
                                id="excludeRegex"
                                value={config.excludeRegex || ''}
                                onChange={(e) => handleChange('excludeRegex', e.target.value)}
                                placeholder="Standard|3.0x|2.0x"
                                readOnly={readOnly}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                使用正则表达式排除不需要的节点
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Append Subscription Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">追加订阅列表</h3>
                        <p className="text-sm text-muted-foreground">
                            合并其他机场订阅，支持自定义筛选地区
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAppendSubListAdd}
                        disabled={readOnly}
                        className="flex items-center gap-1"
                    >
                        <PlusIcon className="w-4 h-4" />
                        添加订阅源
                    </Button>
                </div>

                <div className="space-y-4">
                    {(!config.appendSubList || config.appendSubList.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                            <p>暂无追加订阅</p>
                            <p className="text-xs mt-1">点击上方按钮添加更多订阅源</p>
                        </div>
                    )}

                    {config.appendSubList?.map((item, index) => (
                        <SubConfigCard
                            key={index}
                            index={index}
                            item={item}
                            readOnly={readOnly}
                            onUpdate={handleAppendSubListUpdate}
                            onRemove={handleAppendSubListRemove}
                            onAreaChange={handleAppendSubListAreaChange}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
