'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, CaretDown, Funnel, MagnifyingGlass as Search } from '@phosphor-icons/react';
import type { SortDirection, UserScope, UserSort } from '../utils/userUtils';

export interface UserFilterBarProps {
    searchTerm: string;
    scope: UserScope;
    sort: UserSort;
    sortDir: SortDirection;
    filteredCount: number;
    totalUsers: number;
    onSearchTermChange: (term: string) => void;
    onScopeChange: (scope: UserScope) => void;
    onSortChange: (sort: UserSort) => void;
    onToggleSortDir: () => void;
}

const SCOPE_LABELS: Record<UserScope, string> = {
    all: '全部用户',
    attention: '有待处理',
    depleting: '消耗过快',
    expiring: '7 天内到期',
    'no-expiry': '到期未提供',
};

const SORT_LABELS: Record<UserSort, string> = {
    attention: '异常优先',
    recent: '最近更新',
    remaining: '剩余流量',
};

/**
 * 瀑布流顶部的悬停控制条：收起时一行显示当前筛选摘要，
 * 悬停 / 聚焦 / 点击展开为完整的搜索、范围、排序控件。
 */
export function UserFilterBar({
    searchTerm,
    scope,
    sort,
    sortDir,
    filteredCount,
    totalUsers,
    onSearchTermChange,
    onScopeChange,
    onSortChange,
    onToggleSortDir,
}: UserFilterBarProps) {
    // 点击展开兜底触屏等没有悬停的环境
    const [pinnedOpen, setPinnedOpen] = useState(false);

    return (
        <div
            className={cn(
                'group sticky top-[104px] z-30 rounded-xl border border-border/60 bg-card/80 backdrop-blur transition-shadow lg:top-[76px]',
                'hover:shadow-md hover:shadow-black/5 focus-within:shadow-md focus-within:shadow-black/5',
            )}
        >
            {/* 收起态摘要行：始终可见，点击可固定展开 */}
            <button
                type="button"
                onClick={() => setPinnedOpen((open) => !open)}
                aria-expanded={pinnedOpen}
                className="flex min-h-11 w-full items-center gap-3 px-3.5 text-left text-xs text-muted-foreground"
            >
                <Funnel className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                    {searchTerm ? `搜索「${searchTerm}」` : '搜索'}
                    {' · '}{SCOPE_LABELS[scope]}
                    {' · '}{SORT_LABELS[sort]}{sortDir === 'asc' ? ' ↑' : ' ↓'}
                </span>
                <span className="shrink-0 tabular-nums">{filteredCount} / {totalUsers}</span>
                <CaretDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', pinnedOpen && 'rotate-180')} />
            </button>

            {/* 展开态控件：悬停 / 聚焦 / 点击固定 均可展开 */}
            <div
                className={cn(
                    'grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out',
                    'group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]',
                    pinnedOpen && 'grid-rows-[1fr]',
                )}
            >
                <div className="overflow-hidden">
                    <div className="flex flex-col gap-2 border-t border-border/50 p-3 sm:flex-row sm:items-center">
                        <div className="relative min-w-0 flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                aria-label="搜索用户"
                                placeholder="用户 ID / 配置名 / 订阅标识"
                                value={searchTerm}
                                onChange={(e) => onSearchTermChange(e.target.value)}
                                className="h-9 bg-background pl-9"
                            />
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <Select value={scope} onValueChange={(value) => onScopeChange(value as UserScope)}>
                                <SelectTrigger aria-label="范围" className="h-9 w-32 bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(SCOPE_LABELS) as UserScope[]).map((value) => (
                                        <SelectItem key={value} value={value}>{SCOPE_LABELS[value]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={sort} onValueChange={(value) => onSortChange(value as UserSort)}>
                                <SelectTrigger aria-label="排序" className="h-9 w-32 bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(SORT_LABELS) as UserSort[]).map((value) => (
                                        <SelectItem key={value} value={value}>{SORT_LABELS[value]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={onToggleSortDir}
                                className="h-9 w-9 shrink-0 bg-background"
                                title={sortDir === 'asc' ? '当前升序，点击切换为降序' : '当前降序，点击切换为升序'}
                            >
                                {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
