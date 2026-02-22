'use client';

import { useState, useCallback } from 'react';
import { SubConfigCard } from '@/app/config/components/SubConfigCard';
import { Button } from '@/components/ui/button';
import { Plus, ListPlus } from 'lucide-react';
import { SubConfig, AreaCode } from '@/types/user-config';
import { Label } from '@/components/ui/label';
import { secondaryActionButtonClass } from '@/lib/utils';
import { getRandomEmoji } from '@/utils/emojiUtils';

export function SubscriptionDemo() {
    const [subList, setSubList] = useState<SubConfig[]>([
        {
            subscribe: 'https://example.com/sub/backup1',
            flag: '备用一',
            includeArea: ['HK', 'JP', 'SG']
        },
    ]);

    const handleAdd = useCallback(() => {
        const newItem: SubConfig = {
            subscribe: '',
            flag: getRandomEmoji(),
            includeArea: []
        };
        setSubList(prev => [...prev, newItem]);
    }, []);

    const handleRemove = useCallback((index: number) => {
        //setSubList(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleUpdate = useCallback(<K extends keyof SubConfig>(index: number, field: K, value: SubConfig[K]) => {
        setSubList(prev => {
            const newList = [...prev];
            newList[index] = { ...newList[index], [field]: value };
            return newList;
        });
    }, []);

    const handleAreaChange = useCallback((index: number, area: AreaCode, checked: boolean) => {
        setSubList(prev => {
            const newList = [...prev];
            const item = newList[index];
            const currentAreas = item.includeArea || [];
            let newAreas: AreaCode[];
            if (checked) {
                newAreas = [...currentAreas, area];
            } else {
                newAreas = currentAreas.filter((a) => a !== area);
            }
            newList[index] = { ...newList[index], includeArea: newAreas };
            return newList;
        });
    }, []);

    return (
        <div className="bg-card/50 backdrop-blur shadow-xl space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <Label className="text-base flex items-center gap-2">
                        <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <ListPlus className="w-3.5 h-3.5" />
                        </div>
                        追加订阅列表
                    </Label>
                </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {subList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                        <p>暂无追加订阅</p>
                        <p className="text-xs mt-1">点击上方按钮添加更多订阅源</p>
                    </div>
                )}
                {subList.map((item, index) => (
                    <SubConfigCard
                        key={index}
                        index={index}
                        item={item}
                        onUpdate={handleUpdate}
                        onRemove={handleRemove}
                        onAreaChange={handleAreaChange}
                    />
                ))}
            </div>
        </div>
    );
}
