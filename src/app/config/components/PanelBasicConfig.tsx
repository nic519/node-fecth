import { AreaCode, UserConfig, SubConfig } from '@/types/user-config';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Filter, ListPlus, Network, Plus } from 'lucide-react';
import { PromoLinkButton } from '@/components/PromoLinkButton';
import { getRandomEmoji } from '@/utils/emojiUtils';
import { useCallback, useMemo } from 'react';
import { SubConfigCard } from './SubConfigCard';
import { Separator } from '@/components/ui/separator';
import { PanelTopBar } from './PanelTopBar';
import { AREA_CODES, AREA_EMOJI } from '@/config/proxy-area.config';
import { PROMO_URL } from '@/config/constants';
import { setSubscriptionList } from '@/modules/user/subscription-list';

interface BasicConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    uid?: string;
}


export function PanelBasicConfig({
    config,
    onChange,
    readOnly = false,
    uid,
}: BasicConfigProps) {
    const subscriptions = useMemo(() => config.appendSubList ?? [], [config.appendSubList]);

    const handleChange = useCallback(<K extends keyof UserConfig>(key: K, value: UserConfig[K]) => {
        onChange({ ...config, [key]: value });
    }, [config, onChange]);

    const handleAppendSubListAdd = useCallback(() => {
        const newItem: SubConfig = {
            subscribe: '',
            flag: getRandomEmoji(),
            includeArea: [],
        };
        onChange(setSubscriptionList(config, [...subscriptions, newItem]));
    }, [config, onChange, subscriptions]);

    const handleAppendSubListRemove = useCallback((index: number) => {
        const newList = subscriptions.filter((_, i) => i !== index);
        onChange(setSubscriptionList(config, newList));
    }, [config, onChange, subscriptions]);

    const handleAppendSubListUpdate = useCallback(<K extends keyof SubConfig>(index: number, field: K, value: SubConfig[K]) => {
        const newList = [...subscriptions];
        newList[index] = { ...newList[index], [field]: value };
        onChange(setSubscriptionList(config, newList));
    }, [config, onChange, subscriptions]);

    const handleAppendSubListAreaChange = useCallback((index: number, area: AreaCode, checked: boolean) => {
        const item = subscriptions[index];
        if (!item) {
            return;
        }
        const currentAreas = item.includeArea || [];
        let newAreas: AreaCode[];
        if (checked) {
            newAreas = [...currentAreas, area];
        } else {
            newAreas = currentAreas.filter((a) => a !== area);
        }
        handleAppendSubListUpdate(index, 'includeArea', newAreas);
    }, [handleAppendSubListUpdate, subscriptions]);

    const handleMultiPortAreaChange = useCallback((area: AreaCode, checked: boolean) => {
        const current = config.multiPortMode ?? [];
        const next = checked ? [...current, area] : current.filter((a) => a !== area);
        // 全不选时置空，避免空数组被误当作“启用多端口但没有地区”。
        handleChange('multiPortMode', next.length ? next : undefined);
    }, [config.multiPortMode, handleChange]);

    return (
        <div className="space-y-8">
            {/* Main Configuration Section */}
            <div className="space-y-6">
                <PanelTopBar
                    description="填写订阅源与生成配置的基础信息。"
                    right={(
                        <PromoLinkButton promoUrl={PROMO_URL} />
                    )}
                />

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <Label htmlFor="fileName" className="flex items-center gap-2 group-focus-within:text-primary transition-colors">
                                <FileText className="h-4 w-4 text-muted-foreground" />
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
                                <Filter className="h-4 w-4 text-muted-foreground" />
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Label className="flex items-center gap-2 text-base">
                            <ListPlus className="h-[18px] w-[18px] text-muted-foreground" />
                            订阅源
                        </Label>
                        <p className="text-xs text-muted-foreground mt-2">
                            强烈建议使用 <b>至少两个节点源</b> 作为互相备份，以免忘记充值或者 <b>其他不可抗拒因素</b> 导致断网
                        </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleAppendSubListAdd}
                        disabled={readOnly}
                        variant="outline"
                        className="flex shrink-0 items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        添加订阅源
                    </Button>
                </div>

                <div className="space-y-4">
                    {subscriptions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                            <p>暂无订阅源</p>
                            <p className="text-xs mt-1">点击上方按钮添加订阅源</p>
                        </div>
                    )}

                    {subscriptions.map((item, index) => (
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

            <details className="border-t border-border/60 pt-4">
                <summary className="cursor-pointer rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    高级设置
                </summary>
                <div className="space-y-2 pt-4">
                    <Label className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        多端口地区
                    </Label>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {AREA_CODES.map((area: AreaCode) => {
                            const isChecked = config.multiPortMode?.includes(area) || false;
                            return (
                                <div key={`multiport-${area}`} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`multiport-${area}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => handleMultiPortAreaChange(area, checked as boolean)}
                                        disabled={readOnly}
                                    />
                                    <Label
                                        htmlFor={`multiport-${area}`}
                                        className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span>{AREA_EMOJI[area]}</span>
                                        <span>{area}</span>
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        适合配合指纹浏览器等工具使用，为不同浏览器环境配置独立的代理端口。
                    </p>
                    <p className="text-xs text-muted-foreground">
                        勾选的地区会生成多端口监听，把该地区的节点按端口拆分直连；<b>全不选</b>则不启用多端口模式
                    </p>
                </div>
            </details>
        </div>
    );
}
