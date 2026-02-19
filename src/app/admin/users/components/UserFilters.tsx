'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter, RefreshCw, UserPlus, Download, Upload } from 'lucide-react';

import { AdminSidePanel } from '@/components/admin/AdminSidePanel';

export interface UserFiltersProps {
    searchTerm: string;
    loading: boolean;
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
    onSearchTermChange,
    onRefresh,
    onAddUser,
    onExport,
    onImport,
}: UserFiltersProps) {
    return (
        <AdminSidePanel title="筛选与操作" icon={Filter} className="h-fit">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">搜索用户</label>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            type="text"
                            placeholder="输入用户ID..."
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            className="pl-9 bg-muted/30 border-border/60 focus:bg-background focus-visible:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/60">
                    <label className="text-sm font-medium text-muted-foreground">快捷操作</label>
                    <Button
                        onClick={onRefresh}
                        disabled={loading}
                        variant="outline"
                        className="w-full justify-start text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        刷新列表
                    </Button>

                    {onAddUser && (
                        <Button
                            onClick={onAddUser}
                            className="w-full justify-start bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md transition-all duration-300"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            添加新用户
                        </Button>
                    )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border/60">
                    <label className="text-sm font-medium text-muted-foreground">数据迁移</label>
                    {onExport && (
                        <Button
                            onClick={onExport}
                            disabled={loading}
                            variant="outline"
                            className="w-full justify-start text-muted-foreground hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-800 transition-all"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            导出配置
                        </Button>
                    )}

                    {onImport && (
                        <Button
                            onClick={onImport}
                            disabled={loading}
                            variant="outline"
                            className="w-full justify-start text-muted-foreground hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30 dark:hover:border-amber-800 transition-all"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            导入配置
                        </Button>
                    )}
                </div>
            </div>
        </AdminSidePanel>
    );
}
