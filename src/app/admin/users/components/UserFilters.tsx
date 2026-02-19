'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter, RefreshCw, UserPlus, Download, Upload, Users, Database } from 'lucide-react';

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
            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">总用户</div>
                    <div className="text-xl font-bold text-foreground">{totalUsers}</div>
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground font-medium mb-1">当前显示</div>
                    <div className="text-xl font-bold text-primary">{filteredCount}</div>
                </div>
            </div>

            {/* 搜索区域 */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">搜索</label>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="text"
                        placeholder="输入用户ID..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="pl-9 bg-background/50 border-border/60 focus:bg-background focus-visible:ring-primary/20 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* 主要操作 */}
            {onAddUser && (
                <div className="space-y-3 pt-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">操作</label>
                    <Button
                        onClick={onAddUser}
                        className="w-full justify-center bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-700 text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        添加新用户
                    </Button>
                </div>
            )}

            {/* 数据管理 */}
            {(onExport || onImport) && (
                <div className="space-y-3 pt-4 border-t border-border/60">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-1.5">
                        <Database className="w-3 h-3" />
                        数据管理
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {onExport && (
                            <Button
                                onClick={onExport}
                                disabled={loading}
                                variant="outline"
                                size="sm"
                                className="w-full justify-center h-9 text-xs font-medium text-muted-foreground hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800 transition-all"
                            >
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                导出
                            </Button>
                        )}

                        {onImport && (
                            <Button
                                onClick={onImport}
                                disabled={loading}
                                variant="outline"
                                size="sm"
                                className="w-full justify-center h-9 text-xs font-medium text-muted-foreground hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 dark:hover:border-amber-800 transition-all"
                            >
                                <Upload className="mr-1.5 h-3.5 w-3.5" />
                                导入
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </AdminSidePanel>
    );
}
