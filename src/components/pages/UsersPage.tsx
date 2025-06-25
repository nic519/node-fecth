import { AdminLayout } from '../AdminLayout';

interface User {
	userId: string;
	hasConfig: boolean;
	source: string;
	lastModified: string | null;
}

interface UsersPageProps {
	superToken: string;
	users?: User[];
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

	// 如果没有传入初始数据，使用示例数据
	const users: User[] = initialUsers || [
		{ 
			userId: 'loading',
			hasConfig: false,
			source: 'loading',
			lastModified: null
		}
	];

	return (
		<AdminLayout title="用户管理 - 超级管理员后台" currentPage="users" superToken={superToken}>
			<div className="space-y-6">
				{/* 页面标题和操作按钮 */}
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
						<p className="text-gray-600 mt-1">管理系统中的所有用户账户 (数据来自 API)</p>
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
						<h2 className="text-lg font-semibold text-gray-900">用户列表 (API 数据)</h2>
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
												user.source === 'loading' ? 'bg-gray-100 text-gray-800' :
												'bg-gray-100 text-gray-800'
											}`}>
												{user.source}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{formatDateTime(user.lastModified)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex space-x-2">
												<button className="text-blue-600 hover:text-blue-900">查看</button>
												<button className="text-green-600 hover:text-green-900">编辑</button>
												<button className="text-red-600 hover:text-red-900">删除</button>
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

			{/* 客户端 JavaScript */}
			<script dangerouslySetInnerHTML={{
				__html: `
				(function() {
					const superToken = '${superToken}';
					let allUsers = [];
					
					// 从 API 获取用户数据
					async function fetchUsers() {
						try {
							console.log('开始获取用户数据...');
							const response = await fetch('/api/config/allUsers', {
								method: 'GET',
								headers: {
									'Authorization': 'Bearer ' + superToken,
									'Content-Type': 'application/json',
								},
							});

							if (!response.ok) {
								throw new Error('HTTP error! status: ' + response.status);
							}

							const data = await response.json();
							console.log('API 响应:', data);
							
							if (data.users && Array.isArray(data.users)) {
								allUsers = data.users;
								renderUsers(allUsers);
								updatePaginationInfo(allUsers.length);
								return data.users;
							} else {
								throw new Error(data.message || '获取用户数据失败');
							}
						} catch (err) {
							console.error('获取用户列表失败:', err);
							showError('获取用户数据失败: ' + err.message);
							return [];
						}
					}

					// 渲染用户列表
					function renderUsers(users) {
						const tbody = document.getElementById('users-tbody');
						if (!tbody) return;

						tbody.innerHTML = users.map(user => 
							'<tr class="hover:bg-gray-50">' +
								'<td class="px-6 py-4 whitespace-nowrap">' +
									'<div class="text-sm font-medium text-gray-900">' + user.userId + '</div>' +
								'</td>' +
								'<td class="px-6 py-4 whitespace-nowrap">' +
									'<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + 
									(user.hasConfig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') + '">' +
										(user.hasConfig ? '已配置' : '未配置') +
									'</span>' +
								'</td>' +
								'<td class="px-6 py-4 whitespace-nowrap">' +
									'<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + getSourceClass(user.source) + '">' +
										user.source +
									'</span>' +
								'</td>' +
								'<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + 
									formatDateTime(user.lastModified) + 
								'</td>' +
								'<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
									'<div class="flex space-x-2">' +
										'<button class="text-blue-600 hover:text-blue-900">查看</button>' +
										'<button class="text-green-600 hover:text-green-900">编辑</button>' +
										'<button class="text-red-600 hover:text-red-900">删除</button>' +
									'</div>' +
								'</td>' +
							'</tr>'
						).join('');
					}

					// 获取数据源样式类
					function getSourceClass(source) {
						switch(source) {
							case 'kv': return 'bg-blue-100 text-blue-800';
							case 'env': return 'bg-yellow-100 text-yellow-800';
							default: return 'bg-gray-100 text-gray-800';
						}
					}

					// 格式化时间
					function formatDateTime(dateString) {
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
					}

					// 更新分页信息
					function updatePaginationInfo(count) {
						const info = document.getElementById('pagination-info');
						if (info) {
							info.textContent = '显示 1-' + count + ' 条，共 ' + count + ' 条记录';
						}
					}

					// 显示错误信息
					function showError(message) {
						const tbody = document.getElementById('users-tbody');
						if (tbody) {
							tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-600">' + message + '</td></tr>';
						}
					}

					// 搜索和筛选功能
					function filterUsers() {
						const searchTerm = document.getElementById('search-input').value.toLowerCase();
						const statusFilter = document.getElementById('status-filter').value;
						
						const filteredUsers = allUsers.filter(user => {
							const matchesSearch = !searchTerm || 
								user.userId.toLowerCase().includes(searchTerm);
							
							const matchesStatus = !statusFilter || 
								(statusFilter === 'configured' && user.hasConfig) ||
								(statusFilter === 'unconfigured' && !user.hasConfig);
							
							return matchesSearch && matchesStatus;
						});
						
						renderUsers(filteredUsers);
						updatePaginationInfo(filteredUsers.length);
					}

					// 绑定事件监听器
					document.addEventListener('DOMContentLoaded', function() {
						// 页面加载时自动获取数据
						fetchUsers();
						
						// 绑定刷新按钮
						const refreshBtn = document.getElementById('refresh-btn');
						if (refreshBtn) {
							refreshBtn.addEventListener('click', fetchUsers);
						}
						
						// 绑定搜索框
						const searchInput = document.getElementById('search-input');
						if (searchInput) {
							searchInput.addEventListener('input', filterUsers);
						}
						
						// 绑定状态筛选
						const statusFilter = document.getElementById('status-filter');
						if (statusFilter) {
							statusFilter.addEventListener('change', filterUsers);
						}
					});
				})();
				`
			}} />
		</AdminLayout>
	);
} 