'use client';

import { Button, Input, Select, SelectItem } from '@heroui/react';

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
                <div className="flex-1 w-full">
                    <Input
                        type="text"
                        placeholder="搜索用户ID..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        variant="bordered"
                        radius="lg"
                        size="md"
                        startContent={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        }
                        classNames={{
                            inputWrapper: "h-10 min-h-10 items-center px-3 bg-transparent border-1 border-gray-200 hover:border-gray-300 focus-within:!border-blue-500 shadow-none",
                            innerWrapper: "bg-transparent gap-2",
                            input: "text-sm leading-none placeholder:text-gray-400",
                        }}
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto items-center">
                    <Select
                        selectedKeys={statusFilter ? [statusFilter] : ["all"]}
                        onChange={(e) => onStatusFilterChange(e.target.value === "all" ? "" : e.target.value)}
                        variant="bordered"
                        radius="lg"
                        size="md"
                        className="w-full sm:w-40"
                        placeholder="所有状态"
                        aria-label="状态筛选"
                        disallowEmptySelection
                        classNames={{
                            trigger: "h-10 min-h-10 items-center px-3 bg-transparent border-1 border-gray-200 hover:border-gray-300 focus:border-blue-500 shadow-none",
                            value: "text-sm",
                            selectorIcon: "text-gray-400",
                            popoverContent: "border border-gray-200 shadow-lg",
                        }}
                    >
                        <SelectItem key="all" textValue="所有状态">所有状态</SelectItem>
                        <SelectItem key="configured" textValue="已配置">已配置</SelectItem>
                        <SelectItem key="unconfigured" textValue="未配置">未配置</SelectItem>
                    </Select>
                    <Button
                        onPress={onRefresh}
                        isDisabled={loading}
                        variant="flat"
                        color="default"
                        radius="lg"
                        size="md"
                        isLoading={loading}
                        className="h-10 bg-gray-100 text-gray-700 font-medium min-w-20 border border-transparent hover:bg-gray-200 whitespace-nowrap"
                    >
                        刷新
                    </Button>
                    {onAddUser && (
                        <Button
                            onPress={onAddUser}
                            variant="solid"
                            color="primary"
                            radius="lg"
                            size="md"
                            className="h-10 bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-blue-200/50 shadow-lg min-w-28 whitespace-nowrap gap-2"
                            startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            }
                        >
                            添加用户
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
