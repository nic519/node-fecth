'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter, RefreshCw, UserPlus } from 'lucide-react';

export interface UserFiltersProps {
    searchTerm: string;
    loading: boolean;
    onSearchTermChange: (term: string) => void;
    onRefresh: () => void;
    onAddUser?: () => void;
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
}: UserFiltersProps) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Filter className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="font-semibold text-gray-900">筛选与操作</h2>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">搜索用户</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="输入用户ID..."
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                            className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-700">快捷操作</label>
                    <Button
                        onClick={onRefresh}
                        disabled={loading}
                        variant="outline"
                        className="w-full justify-start text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
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
                            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            添加新用户
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
