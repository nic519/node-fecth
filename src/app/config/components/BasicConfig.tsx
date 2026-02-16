import { UserConfig, SubConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AREA_CODES } from '@/config/proxy-area.config';

interface BasicConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
}

export function BasicConfig({ config, onChange, readOnly = false }: BasicConfigProps) {
    const handleChange = (key: keyof UserConfig, value: any) => {
        onChange({ ...config, [key]: value });
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
        <>
            <div className="space-y-2">
                <Label htmlFor="subscribe">订阅地址</Label>
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
                <Label htmlFor="fileName">文件名</Label>
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
                <Label htmlFor="excludeRegex">排除正则</Label>
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
                    <Label className="text-base font-semibold">追加订阅列表</Label>
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

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`sub-url-${index}`}>订阅链接</Label>
                                        <Input
                                            id={`sub-url-${index}`}
                                            value={item.subscribe}
                                            onChange={(e) => handleAppendSubListUpdate(index, 'subscribe', e.target.value)}
                                            placeholder="https://example.com/sub"
                                            readOnly={readOnly}
                                        />
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div className="space-y-2 w-full md:w-32 flex-shrink-0">
                                            <Label htmlFor={`sub-flag-${index}`}>标识</Label>
                                            <Input
                                                id={`sub-flag-${index}`}
                                                value={item.flag}
                                                onChange={(e) => handleAppendSubListUpdate(index, 'flag', e.target.value)}
                                                placeholder="sub-1"
                                                readOnly={readOnly}
                                                maxLength={5}
                                            />
                                        </div>

                                        <div className="space-y-2 flex-grow">
                                            <Label>包含地区</Label>
                                            <div className="flex flex-wrap gap-4 pt-2">
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
                                            <p className="text-xs text-muted-foreground mt-1">可选。若不选则默认包含所有地区。</p>
                                        </div>
                                    </div>
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
    );
}
