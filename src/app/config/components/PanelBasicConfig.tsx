import { AreaCode, UserConfig, SubConfig } from '@/types/user-config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link, FileText, Filter, ListPlus, Plus, Sparkles, ArrowUpRight } from 'lucide-react';
import { getRandomEmoji } from '@/utils/emojiUtils';
import { useCallback } from 'react';
import { SubConfigCard } from './SubConfigCard';
import { Separator } from '@/components/ui/separator';
import { PanelTopBar } from './PanelTopBar';

interface BasicConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    uid?: string;
}

interface PromoLinkButtonProps {
    promoUrl: string;
}

function PromoLinkButton({ promoUrl }: PromoLinkButtonProps) {
    return (
        <Button
            size="sm"
            asChild
            className="h-10 px-3 text-xs font-medium text-white bg-gradient-to-r from-orange-700 to-amber-600 hover:from-amber-800 hover: border-orange-600/20 transition-all hover:scale-105 active:scale-95 duration-300"
        >
            <a href={promoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 transition-transform duration-300 motion-safe:hover:-translate-y-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="flex flex-col items-start leading-tight">
                    <span>订阅推广注册</span>
                    <span className="text-[10px] text-white/85 font-normal">性价比高，延迟极低</span>
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
        </Button>
    );
}

export function PanelBasicConfig({ config, onChange, readOnly = false, uid }: BasicConfigProps) {
    const promoUrl = 'https://i03.1ytaff.com/register?aff=bYJ44TS8';

    const handleChange = useCallback(<K extends keyof UserConfig>(key: K, value: UserConfig[K]) => {
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

    const handleAppendSubListUpdate = useCallback(<K extends keyof SubConfig>(index: number, field: K, value: SubConfig[K]) => {
        const currentList = config.appendSubList || [];
        const newList = [...currentList];
        newList[index] = { ...newList[index], [field]: value };
        handleChange('appendSubList', newList);
    }, [config.appendSubList, handleChange]);

    const handleAppendSubListAreaChange = useCallback((index: number, area: AreaCode, checked: boolean) => {
        const currentList = config.appendSubList || [];
        const item = currentList[index];
        const currentAreas = item.includeArea || [];
        let newAreas: AreaCode[];
        if (checked) {
            newAreas = [...currentAreas, area];
        } else {
            newAreas = currentAreas.filter((a) => a !== area);
        }
        handleAppendSubListUpdate(index, 'includeArea', newAreas);
    }, [config.appendSubList, handleAppendSubListUpdate]);

    return (
        <div className="space-y-8">
            {/* Main Configuration Section */}
            <div className="space-y-6">
                <PanelTopBar
                    description="填写主订阅与生成配置的基础信息。"
                    right={(
                        <PromoLinkButton promoUrl={promoUrl} />
                    )}
                />

                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <Label htmlFor="subscribe" className="text-base flex items-center gap-2 group-focus-within:text-primary transition-colors">
                            <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Link className="w-3.5 h-3.5" />
                            </div>
                            主订阅地址
                        </Label>
                        <Input
                            id="subscribe"
                            value={config.subscribe || ''}
                            onChange={(e) => handleChange('subscribe', e.target.value)}
                            placeholder="https://example.com/subscription"
                            readOnly={readOnly}
                            className="font-mono transition-all border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
                        />
                        <p className="text-sm text-muted-foreground">
                            必填。您的主要机场订阅链接，将作为配置的基础。
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <Label htmlFor="fileName" className="flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <div className="p-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                    <FileText className="w-3.5 h-3.5" />
                                </div>
                                配置显示名
                            </Label>
                            <Input
                                id="fileName"
                                value={config.fileName || ''}
                                onChange={(e) => handleChange('fileName', e.target.value)}
                                placeholder={uid ? `${uid}.yaml` : 'miho-cfg.yaml'}
                                readOnly={readOnly}
                                className="transition-all border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
                            />
                            <p className="text-xs text-muted-foreground">
                                生成的配置文件名 (默认为 {uid ? `${uid}.yaml` : 'miho-cfg.yaml'})
                            </p>
                        </div>

                        <div className="space-y-2 group">
                            <Label htmlFor="excludeRegex" className="flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <div className="p-1 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                    <Filter className="w-3.5 h-3.5" />
                                </div>
                                节点排除正则
                            </Label>
                            <Input
                                id="excludeRegex"
                                value={config.excludeRegex || ''}
                                onChange={(e) => handleChange('excludeRegex', e.target.value)}
                                placeholder="Standard|3.0x|2.0x"
                                readOnly={readOnly}
                                className="font-mono transition-all border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
                            />
                            <p className="text-xs text-muted-foreground">
                                使用正则表达式排除不需要的节点
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-border/60" />

            {/* Append Subscription Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-primary/80">
                            <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                <ListPlus className="w-5 h-5" />
                            </div>
                            追加订阅列表
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 ml-9">
                            合并其他机场订阅，支持自定义筛选地区
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleAppendSubListAdd}
                        disabled={readOnly}
                        className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg shadow-emerald-500/20 border-0 transition-all hover:scale-105 active:scale-95"
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
