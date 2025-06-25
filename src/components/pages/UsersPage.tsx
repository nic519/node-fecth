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
	return (
		<AdminLayout title="用户管理 - 超级管理员后台" currentPage="users" superToken={superToken}>
			{/* Alpine.js 用户管理组件 */}
			<div 
				className="space-y-6"
				x-data={`usersManager('${superToken}')`}
			>
				{/* 页面标题和操作按钮 */}
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
						<p className="text-gray-600 mt-1">管理系统中的所有用户账户 (数据来自超级管理员 API)</p>
					</div>
					<button 
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						x-on:click="handleAddUser()"
					>
						+ 添加用户
					</button>
				</div>

				{/* 搜索和筛选 */}
				<div className="bg-white p-4 rounded-lg shadow-sm border">
					<div className="flex gap-4">
						<div className="flex-1">
							<input 
								type="text" 
								placeholder="搜索用户ID..." 
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								x-model="searchTerm"
								x-on:input="filterUsers()"
							/>
						</div>
						<select 
							className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							x-model="statusFilter"
							x-on:change="filterUsers()"
						>
							<option value="">所有状态</option>
							<option value="configured">已配置</option>
							<option value="unconfigured">未配置</option>
						</select>
						<select 
							className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							x-model="sourceFilter"
							x-on:change="filterUsers()"
						>
							<option value="">所有数据源</option>
							<option value="kv">KV 存储</option>
							<option value="env">环境变量</option>
							<option value="none">无配置</option>
						</select>
						<button 
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
							x-on:click="fetchUsers()"
							x-bind:disabled="loading"
						>
							<span x-show="!loading">刷新</span>
							<span x-show="loading">刷新中...</span>
						</button>
					</div>
				</div>

				{/* 错误信息 */}
				<div x-show="error" className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="text-red-800" x-text="error"></div>
				</div>

				{/* 用户列表 */}
				<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">
							用户列表 (超级管理员 API 数据)
							<span x-show="loading" className="text-sm text-gray-500 ml-2">加载中...</span>
						</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
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
							<tbody className="bg-white divide-y divide-gray-200">
								{/* 加载状态 */}
								<tr x-show="loading && filteredUsers.length === 0">
									<td colSpan="6" className="px-6 py-4 text-center text-gray-500">
										正在加载用户数据...
									</td>
								</tr>
								
								{/* 无数据状态 */}
								<tr x-show="!loading && filteredUsers.length === 0 && !error">
									<td colSpan="6" className="px-6 py-4 text-center text-gray-500">
										暂无用户数据
									</td>
								</tr>
								
								{/* 用户列表 */}
								<template x-for="user in filteredUsers" x-key="user.userId">
									<tr className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900" x-text="user.userId"></div>
											<div x-show="user.subscribeUrl" className="text-xs text-gray-500 truncate max-w-32" x-bind:title="user.subscribeUrl" x-text="user.subscribeUrl"></div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span 
												className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
												x-bind:class="user.hasConfig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
												x-text="user.hasConfig ? '已配置' : '未配置'"
											></span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span 
												className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
												x-bind:class="getSourceClass(user.source)"
												x-text="getSourceText(user.source)"
											></span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											<div x-show="user.trafficInfo" className="space-y-1">
												<div className="text-xs">
													<span x-text="formatTraffic(user.trafficInfo?.used || 0)"></span> / 
													<span x-text="formatTraffic(user.trafficInfo?.total || 0)"></span>
												</div>
												<div className="w-20 bg-gray-200 rounded-full h-1.5">
													<div 
														className="h-1.5 rounded-full"
														x-bind:class="{
															'bg-red-500': (user.trafficInfo?.usagePercent || 0) > 90,
															'bg-yellow-500': (user.trafficInfo?.usagePercent || 0) > 70 && (user.trafficInfo?.usagePercent || 0) <= 90,
															'bg-green-500': (user.trafficInfo?.usagePercent || 0) <= 70
														}"
														x-bind:style="`width: \${Math.min(user.trafficInfo?.usagePercent || 0, 100)}%`"
													></div>
												</div>
												<div className="text-xs text-gray-500" x-text="(user.trafficInfo?.usagePercent || 0).toFixed(1) + '%'"></div>
											</div>
											<span x-show="!user.trafficInfo" className="text-gray-400">无数据</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" x-text="formatDateTime(user.lastModified)"></td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex space-x-2">
												<button className="text-blue-600 hover:text-blue-900" x-on:click="handleUserAction('view', user.userId)">查看</button>
												<button className="text-green-600 hover:text-green-900" x-on:click="handleUserAction('edit', user.userId)">编辑</button>
												<button className="text-orange-600 hover:text-orange-900" x-on:click="handleUserAction('refresh', user.userId)">刷新</button>
												<button className="text-red-600 hover:text-red-900" x-on:click="handleUserAction('delete', user.userId)">删除</button>
											</div>
										</td>
									</tr>
								</template>
							</tbody>
						</table>
					</div>
				</div>

				{/* 分页信息 */}
				<div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
					<div className="flex items-center text-sm text-gray-700">
						<span>显示 1-<span x-text="filteredUsers.length"></span> 条，共 <span x-text="filteredUsers.length"></span> 条记录</span>
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

			{/* 引入组件逻辑 */}
			<script src="/js/admin/users-alpine.js"></script>
		</AdminLayout>
	);
} 