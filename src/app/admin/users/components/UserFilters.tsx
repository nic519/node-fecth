'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search } from 'lucide-react';

export interface UserFiltersProps {
    searchTerm: string;
    statusFilter: string;
    loading: boolean;
    onSearchTermChange: (term: string) => void;
    onStatusFilterChange: (filter: string) => void;
    onRefresh: () => void;
    onAddUser?: () => void;
}

/**
 * 用户过滤器组件 - 搜索和筛选控件
 */
export function UserFilters({
    searchTerm,
    statusFilter,
    loading,
    onSearchTermChange,
    onStatusFilterChange,
    onRefresh,
    onAddUser,
}: UserFiltersProps) {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="搜索用户ID..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto items-center">
                    <Select
                        value={statusFilter || "all"}
                        onValueChange={(value) => onStatusFilterChange(value === "all" ? "" : value)}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="所有状态" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">所有状态</SelectItem>
                            <SelectItem value="configured">已配置</SelectItem>
                            <SelectItem value="unconfigured">未配置</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={onRefresh}
                        disabled={loading}
                        variant="secondary"
                        className="min-w-20"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        刷新
                    </Button>

                    {onAddUser && (
                        <Button
                            onClick={onAddUser}
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-28 gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            添加用户
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
