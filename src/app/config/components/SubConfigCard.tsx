import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { parseInlineProxies } from '@/modules/user/inline-proxies';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AREA_CODES, AREA_EMOJI } from '@/config/proxy-area.config';
import { AreaCode, SubConfig } from '@/types/user-config';
import { Flag, Globe, Link, Trash2 } from 'lucide-react';
import { memo } from 'react';

interface SubConfigCardProps {
    index: number;
    item: SubConfig;
    readOnly?: boolean;
    onUpdate: <K extends keyof SubConfig>(index: number, field: K, value: SubConfig[K]) => void;
    onRemove: (index: number) => void;
    onAreaChange: (index: number, area: AreaCode, checked: boolean) => void;
}

export const SubConfigCard = memo(function SubConfigCard({
    index,
    item,
    readOnly,
    onUpdate,
    onRemove,
    onAreaChange
}: SubConfigCardProps) {
    // Logic: If includeArea is empty, it implies "ALL".
    // But in the UI, we follow the "Check to Explicitly Include" pattern.
    // If nothing is checked, the backend treats it as ALL.
    // This can be confusing, so we add a helper text.

    let nodeSummary = '';
    let nodeError = '';
    if (item.type === 'inline' && item.proxiesYaml?.trim()) {
        try { nodeSummary = `已识别 ${parseInlineProxies(item.proxiesYaml).length} 个节点`; }
        catch (error) { nodeError = error instanceof Error ? error.message : '节点 YAML 无效'; }
    }

    return (
        <Card className="relative overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors">
            <CardContent className="p-4 space-y-4">
                <div className="absolute top-2 right-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(index)}
                        disabled={readOnly}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2 pr-8">
                        <Label htmlFor={`sub-type-${index}`}>来源类型</Label>
                        <Select value={item.type ?? 'url'} onValueChange={value => onUpdate(index, 'type', value as 'url' | 'inline')} disabled={readOnly}>
                            <SelectTrigger id={`sub-type-${index}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="url">订阅链接</SelectItem>
                                <SelectItem value="inline">粘贴节点</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {item.type === 'inline' ? (
                        <div className="space-y-2">
                            <Label htmlFor={`sub-proxies-${index}`}>节点 YAML</Label>
                            <Textarea id={`sub-proxies-${index}`} value={item.proxiesYaml ?? ''}
                                onChange={event => onUpdate(index, 'proxiesYaml', event.target.value)}
                                readOnly={readOnly} spellCheck={false} rows={10} className="font-mono text-sm"
                                aria-invalid={!!nodeError} aria-describedby={`sub-proxies-help-${index}`}
                                placeholder={'proxies:\n  - name: 香港 01\n    type: trojan\n    server: example.com\n    port: 443\n    password: "节点密码"'} />
                            <p id={`sub-proxies-help-${index}`} className="text-xs text-muted-foreground">可粘贴完整 YAML、proxies 片段或节点列表。只保存节点；节点更新后请重新粘贴并保存。</p>
                            {nodeError ? <p role="alert" className="text-xs text-destructive">{nodeError}</p>
                                : <p role="status" className="text-xs text-muted-foreground">{nodeSummary}</p>}
                        </div>
                    ) : (

                    <div className="space-y-2">
                        <Label htmlFor={`sub-url-${index}`} className="flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            订阅链接
                        </Label>
                        <Input
                            id={`sub-url-${index}`}
                            value={item.subscribe}
                            onChange={(e) => onUpdate(index, 'subscribe', e.target.value)}
                            placeholder="https://example.com/sub"
                            readOnly={readOnly}
                            className="font-mono text-sm"
                        />
                    </div>

                    )}

                    <div className="space-y-2">
                        <Label htmlFor={`sub-flag-${index}`} className="flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            标识 (Flag)
                        </Label>
                        <Input
                            id={`sub-flag-${index}`}
                            value={item.flag}
                            onChange={(e) => onUpdate(index, 'flag', e.target.value)}
                            placeholder="sub-1"
                            readOnly={readOnly}
                            maxLength={10}
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            用于区分不同订阅源的简短标识
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            筛选地区
                        </Label>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {AREA_CODES.map((area: AreaCode) => {
                                const isChecked = item.includeArea?.includes(area) || false;
                                const emoji = AREA_EMOJI[area];
                                return (
                                    <div key={`${index}-${area}`} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`sub-${index}-area-${area}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => onAreaChange(index, area, checked as boolean)}
                                            disabled={readOnly}
                                        />
                                        <Label
                                            htmlFor={`sub-${index}-area-${area}`}
                                            className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
                                        >
                                            <span>{emoji}</span>
                                            <span>{area}</span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground mt-1">
                            勾选要筛选的地区，防止多订阅模式，<b>过多节点，影响测速速度</b><br />若 <b>全不选</b> 则默认包含所有地区
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
