import { SubConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@heroicons/react/24/outline';
import { AREA_CODES } from '@/config/proxy-area.config';
import { Checkbox } from '@/components/ui/checkbox';
import { memo } from 'react';

interface SubConfigCardProps {
    index: number;
    item: SubConfig;
    readOnly?: boolean;
    onUpdate: (index: number, field: keyof SubConfig, value: any) => void;
    onRemove: (index: number) => void;
    onAreaChange: (index: number, area: string, checked: boolean) => void;
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
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`sub-url-${index}`}>订阅链接</Label>
                        <Input
                            id={`sub-url-${index}`}
                            value={item.subscribe}
                            onChange={(e) => onUpdate(index, 'subscribe', e.target.value)}
                            placeholder="https://example.com/sub"
                            readOnly={readOnly}
                            className="font-mono text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-2">
                            <Label htmlFor={`sub-flag-${index}`}>标识 (Flag)</Label>
                            <Input
                                id={`sub-flag-${index}`}
                                value={item.flag}
                                onChange={(e) => onUpdate(index, 'flag', e.target.value)}
                                placeholder="sub-1"
                                readOnly={readOnly}
                                maxLength={10}
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                用于区分不同订阅源的简短标识或 Emoji。
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>包含地区 (Include Areas)</Label>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {AREA_CODES.map((area) => {
                                    const isChecked = item.includeArea?.includes(area as any) || false;
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
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {area}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[0.8rem] text-muted-foreground mt-1">
                                勾选要保留的地区。若<b>全不选</b>则默认包含所有地区。
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
