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
					<input
						type="text"
						placeholder="搜索用户ID..."
						value={searchTerm}
						onChange={(e) => onSearchTermChange((e.target as HTMLInputElement).value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>
				<select
					value={statusFilter}
					onChange={(e) => onStatusFilterChange((e.target as HTMLSelectElement).value)}
					className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="">所有状态</option>
					<option value="configured">已配置</option>
					<option value="unconfigured">未配置</option>
				</select>
				<select
					value={sourceFilter}
					onChange={(e) => onSourceFilterChange((e.target as HTMLSelectElement).value)}
					className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
					<option value="">所有数据源</option>
					<option value="kv">KV 存储</option>
					<option value="env">环境变量</option>
					<option value="none">无配置</option>
				</select>
				<button
					onClick={onRefresh}
					disabled={loading}
					className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
				>
					{loading ? '刷新中...' : '刷新'}
				</button>
			</div>
		</div>
	);
} 