import { AdminLayout } from '../AdminLayout';

interface UserSummary {
	userId: string;
	hasConfig: boolean;
	source: 'kv' | 'env' | 'none';
	lastModified: string | null; 
	isActive: boolean;
	subscribeUrl?: string;
	status: 'active' | 'inactive' | 'disabled';
	trafficInfo?: {
		upload: number;
		download: number;
		total: number;
		used: number;
		remaining: number;
		expire?: number;
		isExpired: boolean;
		usagePercent: number;
	};
}

interface UsersPageProps {
	superToken: string;
	users?: UserSummary[];
}

export function UsersPage({ superToken, users: initialUsers }: UsersPageProps) {
	// 格式化时间显示
	const formatDateTime = (dateString: string | null): string => {
		if (!dateString) return '无';
		try {
			const date = new Date(dateString);
			return date.toLocaleString('zh-CN', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
		} catch {
			return dateString;
		}
	};

	// 格式化流量显示
	const formatTraffic = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	// 如果没有传入初始数据，使用示例数据
	const users: UserSummary[] = initialUsers || [
		{ 
			userId: 'loading',
			hasConfig: false,
			source: 'none',
			lastModified: null,
			isActive: false,
			status: 'inactive'
		}
	];

	return (
		<AdminLayout title="用户管理 - 超级管理员后台" currentPage="users" superToken={superToken}>
			<div className="space-y-6">
				{/* 页面标题和操作按钮 */}
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
						<p className="text-gray-600 mt-1">管理系统中的所有用户账户 (数据来自超级管理员 API)</p>
					</div>
					<button 
						id="add-user-btn"
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						+ 添加用户
					</button>
				</div>

				{/* 搜索和筛选 */}
				<div className="bg-white p-4 rounded-lg shadow-sm border">
					<div className="flex gap-4">
						<div className="flex-1">
							<input 
								id="search-input"
								type="text" 
								placeholder="搜索用户ID..." 
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<select 
							id="status-filter"
							className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="">所有状态</option>
							<option value="configured">已配置</option>
							<option value="unconfigured">未配置</option>
						</select>
						<select 
							id="source-filter"
							className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						>
							<option value="">所有数据源</option>
							<option value="kv">KV 存储</option>
							<option value="env">环境变量</option>
							<option value="none">无配置</option>
						</select>
						<button 
							id="refresh-btn"
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
						>
							刷新
						</button>
					</div>
				</div>

				{/* 用户列表 */}
				<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">用户列表 (超级管理员 API 数据)</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full" id="users-table">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										用户ID
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										配置状态
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										数据源
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										流量使用
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										最后修改时间
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										操作
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200" id="users-tbody">
								{users.map((user, index) => (
									<tr key={user.userId} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">{user.userId}</div>
											{user.subscribeUrl && (
												<div className="text-xs text-gray-500 truncate max-w-32" title={user.subscribeUrl}>
													{user.subscribeUrl}
												</div>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												user.hasConfig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
											}`}>
												{user.hasConfig ? '已配置' : '未配置'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												user.source === 'kv' ? 'bg-blue-100 text-blue-800' :
												user.source === 'env' ? 'bg-yellow-100 text-yellow-800' :
												'bg-gray-100 text-gray-800'
											}`}>
												{user.source === 'kv' ? 'KV' : user.source === 'env' ? 'ENV' : '无'}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{user.trafficInfo ? (
												<div className="space-y-1">
													<div className="text-xs">
														{formatTraffic(user.trafficInfo.used)} / {formatTraffic(user.trafficInfo.total)}
													</div>
													<div className="w-20 bg-gray-200 rounded-full h-1.5">
														<div 
															className={`h-1.5 rounded-full ${
																user.trafficInfo.usagePercent > 90 ? 'bg-red-500' :
																user.trafficInfo.usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
															}`}
															style={{ width: `${Math.min(user.trafficInfo.usagePercent, 100)}%` }}
														></div>
													</div>
													<div className="text-xs text-gray-500">
														{user.trafficInfo.usagePercent.toFixed(1)}%
													</div>
												</div>
											) : (
												<span className="text-gray-400">无数据</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatDateTime(user.lastModified)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex space-x-2">
												<button className="text-blue-600 hover:text-blue-900" data-action="view" data-user-id={user.userId}>查看</button>
												<button className="text-green-600 hover:text-green-900" data-action="edit" data-user-id={user.userId}>编辑</button>
												<button className="text-orange-600 hover:text-orange-900" data-action="refresh" data-user-id={user.userId}>刷新</button>
												<button className="text-red-600 hover:text-red-900" data-action="delete" data-user-id={user.userId}>删除</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* 分页 */}
				<div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
					<div className="flex items-center text-sm text-gray-700">
						<span id="pagination-info">显示 1-{users.length} 条，共 {users.length} 条记录</span>
					</div>
					<div className="flex space-x-2">
						<button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50" disabled>
							上一页
						</button>
						<button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
							1
						</button>
						<button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50" disabled>
							下一页
						</button>
					</div>
				</div>
			</div>

			{/* 引入独立的JavaScript文件 */}
			<script src="/js/admin/users.js"></script>
			<script dangerouslySetInnerHTML={{
				__html: `
				// 页面加载完成后初始化用户页面管理器
				document.addEventListener('DOMContentLoaded', function() {
					if (window.UsersPageManager) {
						window.UsersPageManager.init('${superToken}');
					}
				});
				`
			}} />
		</AdminLayout>
	);
} 