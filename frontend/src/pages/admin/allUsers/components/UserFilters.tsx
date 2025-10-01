import { Input, Select, SelectItem, Button } from '@heroui/react';

export interface UserFiltersProps {
	searchTerm: string;
	statusFilter: string;
	sourceFilter: string;
	loading: boolean;
	onSearchTermChange: (term: string) => void;
	onStatusFilterChange: (filter: string) => void;
	onSourceFilterChange: (filter: string) => void;
	onRefresh: () => void;
}

/**
 * 用户过滤器组件 - 搜索和筛选控件
 */
export function UserFilters({
	searchTerm,
	statusFilter,
	sourceFilter,
	loading,
	onSearchTermChange,
	onStatusFilterChange,
	onSourceFilterChange,
	onRefresh,
}: UserFiltersProps) {
	return (
		<div className="bg-white p-4 rounded-lg shadow-sm border">
			<div className="flex gap-4">
				<div className="flex-1">
					<Input
						type="text"
						placeholder="搜索用户ID..."
						value={searchTerm}
						onChange={(e) => onSearchTermChange(e.target.value)}
						variant="bordered"
						size="sm"
					/>
				</div>
				<Select
					value={statusFilter}
					onChange={(e) => onStatusFilterChange(e.target.value)}
					variant="bordered"
					size="sm"
					className="w-40"
				>
					<SelectItem key="" value="">所有状态</SelectItem>
					<SelectItem key="configured" value="configured">已配置</SelectItem>
					<SelectItem key="unconfigured" value="unconfigured">未配置</SelectItem>
				</Select>
				<Select
					value={sourceFilter}
					onChange={(e) => onSourceFilterChange(e.target.value)}
					variant="bordered"
					size="sm"
					className="w-40"
				>
					<SelectItem key="" value="">所有数据源</SelectItem>
					<SelectItem key="kv" value="kv">KV 存储</SelectItem>
					<SelectItem key="env" value="env">环境变量</SelectItem>
					<SelectItem key="none" value="none">无配置</SelectItem>
				</Select>
				<Button
					onClick={onRefresh}
					disabled={loading}
					variant="flat"
					color="default"
					size="sm"
					isLoading={loading}
				>
					刷新
				</Button>
			</div>
		</div>
	);
} 