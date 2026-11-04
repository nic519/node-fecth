'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowsClockwise as RefreshCw, Database, DownloadSimple as Download, MagnifyingGlass as Search, SpinnerGap as Loader2, UploadSimple as Upload, UserPlus, UsersThree as Users } from '@phosphor-icons/react';

import { AdminSidePanel } from '@/components/admin/AdminSidePanel';

export interface UserFiltersProps {
    searchTerm: string;
    loading: boolean;
    totalUsers?: number;
    filteredCount?: number;
    onSearchTermChange: (term: string) => void;
    onRefresh: () => void;
    onAddUser?: () => void;
    onExport?: () => void;
    onImport?: () => void;
}

/**
 * 用户过滤器组件 - 侧边栏搜索和操作
 */
export function UserFilters({
    searchTerm,
    loading,
    totalUsers = 0,
    filteredCount = 0,
    onSearchTermChange,
    onRefresh,
    onAddUser,
    onExport,
    onImport,
}: UserFiltersProps) {
    return (
        <AdminSidePanel
            title="用户管理"
            icon={Users}
            className="h-fit space-y-6"
            action={
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={loading}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
                    title="刷新列表"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            }
        >
            <div className="grid grid-cols-2 divide-x divide-border/60 rounded-xl bg-secondary/45 py-3 text-center">
                <div>
                    <div className="text-xs text-muted-foreground">总用户</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums">{totalUsers}</div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground">当前显示</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums text-primary">{filteredCount}</div>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="user-search" className="text-xs font-medium text-muted-foreground">搜索用户</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="user-search"
                        type="search"
                        placeholder="输入用户 ID"
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="bg-background pl-9"
                    />
                </div>
            </div>

            {onAddUser && (
                <Button onClick={onAddUser} className="w-full justify-center">
                    <UserPlus weight="fill" className="h-[18px] w-[18px]" />
                    注册新用户
                </Button>
            )}

            {(onExport || onImport) && (
                <div className="space-y-3 border-t border-border/60 pt-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Database className="h-3.5 w-3.5" />
                        数据管理
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {onExport && (
                            <Button onClick={onExport} disabled={loading} variant="outline" className="w-full justify-center">
                                <Download className="h-4 w-4" />
                                导出
                            </Button>
                        )}
                        {onImport && (
                            <Button onClick={onImport} disabled={loading} variant="outline" className="w-full justify-center">
                                <Upload className="h-4 w-4" />
                                导入
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </AdminSidePanel>
    );
}
