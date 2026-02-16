import { UserConfig, SubConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings2, Link, FileText, Filter, ListPlus, Plus } from 'lucide-react';
import { getRandomEmoji } from '@/utils/emojiUtils';
import { useCallback } from 'react';
import { SubConfigCard } from './SubConfigCard';
import { Separator } from '@/components/ui/separator';

interface BasicConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    uid?: string;
}

export function PanelBasicConfig({ config, onChange, readOnly = false, uid }: BasicConfigProps) {
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
            <div className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                        <Settings2 className="w-5 h-5" />
                        基础设置
                    </h3>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="subscribe" className="text-base flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            主订阅地址
                        </Label>
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
                            <Label htmlFor="fileName" className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                配置显示名
                            </Label>
                            <Input
                                id="fileName"
                                value={config.fileName || ''}
                                onChange={(e) => handleChange('fileName', e.target.value)}
                                placeholder={uid ? `${uid}.yaml` : 'miho-cfg.yaml'}
                                readOnly={readOnly}
                            />
                            <p className="text-xs text-muted-foreground">
                                生成的配置文件名 (默认为 {uid ? `${uid}.yaml` : 'miho-cfg.yaml'})
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excludeRegex" className="flex items-center gap-2">
                                <Filter className="w-4 h-4" />
                                节点排除正则
                            </Label>
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
                </div>
            </div>

            <Separator />

            {/* Append Subscription Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <ListPlus className="w-5 h-5" />
                            追加订阅列表
                        </h3>
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
                        <Plus className="w-4 h-4" />
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
