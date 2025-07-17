import { adminApi } from '@/generated/api-adapters';
import type { UserConfig, UserSummary } from '@/types/user-config';
import { useEffect, useState } from 'preact/hooks';

export function AdminUsers() {
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<UserSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sourceFilter, setSourceFilter] = useState('');

	const superToken = new URLSearchParams(window.location.search).get('superToken') || '';

	useEffect(() => {
		if (!superToken) {
			setError('缺少管理员令牌');
			setLoading(false);
			return;
		}
		fetchUsers();
	}, [superToken]);

	useEffect(() => {
		filterUsers();
	}, [users, searchTerm, statusFilter, sourceFilter]);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			setError(null);

			// 调用真实的管理员 API 获取用户列表
			const response = await adminApi.getAllUsers(superToken);
			
			// 检查响应状态
			if (response.code !== 0) {
				setError(response.msg || '获取用户列表失败');
				setUsers([]);
				return;
			}
			
			// 从新的响应结构中提取用户列表数据
			setUsers(response.data.users);
		} catch (err) {
			console.error('获取用户列表失败:', err);
			setError(err instanceof Error ? err.message : '加载用户数据失败');
			setUsers([]); // 确保错误时清空用户列表
		} finally {
			setLoading(false);
		}
	};

	const filterUsers = () => {
		let filtered = users;

		if (searchTerm) {
			filtered = filtered.filter((user) => user.uid.toLowerCase().includes(searchTerm.toLowerCase()));
		}

		if (statusFilter) {
			if (statusFilter === 'configured') {
				filtered = filtered.filter((user) => user.hasConfig);
			} else if (statusFilter === 'unconfigured') {
				filtered = filtered.filter((user) => !user.hasConfig);
			}
		}

		if (sourceFilter) {
			filtered = filtered.filter((user) => user.source === sourceFilter);
		}

		setFilteredUsers(filtered);
	};

	const formatTraffic = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const formatDateTime = (dateStr: string | null): string => {
		if (!dateStr) return '从未';
		return new Date(dateStr).toLocaleString('zh-CN');
	};

	const getSourceClass = (source: string): string => {
		switch (source) {
			case 'kv':
				return 'bg-blue-100 text-blue-800';
			case 'env':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getSourceText = (source: string): string => {
		switch (source) {
			case 'kv':
				return 'KV 存储';
			case 'env':
				return '环境变量';
			default:
				return '无配置';
		}
	};

	const handleUserAction = async (action: string, uid: string, token?: string) => {
		try {
			switch (action) {
				case 'view':
					if (token) {
						window.open(`/config/${uid}?token=${token}`, '_blank');
					}
					break;
				case 'refresh':
					// 刷新用户流量功能暂不支持
					alert('刷新用户流量功能暂不支持，等待后端API实现');
					break;
				case 'delete':
					if (confirm(`确定要删除用户 ${uid} 吗？此操作不可撤销！`)) {
						try {
							const response = await adminApi.deleteUser(uid, superToken);
							if (response.code === 0) {
								await fetchUsers(); // 重新加载用户列表
								alert(`用户 ${uid} 删除成功`);
							} else {
								alert('删除用户失败: ' + (response.msg || '未知错误'));
							}
						} catch (err) {
							console.error('删除用户失败:', err);
							alert('删除用户失败: ' + (err instanceof Error ? err.message : '未知错误'));
						}
					}
					break;
			}
		} catch (error) {
			console.error('用户操作失败:', error);
			setError(error instanceof Error ? error.message : '操作失败');
		}
	};

	const handleAddUser = async () => {
		const uid = prompt('请输入新用户ID:');
		if (!uid || !uid.trim()) {
			return;
		}

		const accessToken = prompt('请输入用户访问令牌:');
		if (!accessToken || !accessToken.trim()) {
			return;
		}

		const subscribe = prompt('请输入订阅链接:');
		if (!subscribe || !subscribe.trim()) {
			return;
		}

		try {
			const userConfig: UserConfig = {
				subscribe: subscribe.trim(),
				accessToken: accessToken.trim(),
			};

			const response = await adminApi.createUser(uid.trim(), userConfig, superToken);
			if (response.code === 0) {
				await fetchUsers(); // 重新加载用户列表
				alert(`用户 ${uid} 创建成功`);
			} else {
				alert('创建用户失败: ' + (response.msg || '未知错误'));
			}
		} catch (error) {
			console.error('创建用户失败:', error);
			alert('创建用户失败: ' + (error instanceof Error ? error.message : '未知错误'));
		}
	};

	return (
		<div className="min-h-screen bg-gray-100">
			{/* 导航栏 */}
			<nav className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<h1 className="text-xl font-semibold text-gray-900">用户管理</h1>
						</div>
						<div className="flex items-center space-x-4">
							<a
								href={`/admin/dashboard?superToken=${superToken}`}
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								控制台
							</a>
							<a
								href={`/admin/monitor?superToken=${superToken}`}
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								系统监控
							</a>
							<a
								href={`/admin/templates?superToken=${superToken}`}
								className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
							>
								配置模板
							</a>
						</div>
					</div>
				</div>
			</nav>

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0 space-y-6">
					{/* 页面标题和操作按钮 */}
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-2xl font-bold text-gray-900">用户管理</h2>
							<p className="text-gray-600 mt-1">管理系统中的所有用户账户，支持实时查看、创建、删除和流量管理</p>
						</div>
						<button onClick={handleAddUser} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
									value={searchTerm}
									onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)}
								className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="">所有状态</option>
								<option value="configured">已配置</option>
								<option value="unconfigured">未配置</option>
							</select>
							<select
								value={sourceFilter}
								onChange={(e) => setSourceFilter((e.target as HTMLSelectElement).value)}
								className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="">所有数据源</option>
								<option value="kv">KV 存储</option>
								<option value="env">环境变量</option>
								<option value="none">无配置</option>
							</select>
							<button
								onClick={fetchUsers}
								disabled={loading}
								className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
							>
								{loading ? '刷新中...' : '刷新'}
							</button>
						</div>
					</div>

					{/* 错误信息 */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{/* 用户列表 */}
					<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
						<div className="px-6 py-4 border-b border-gray-200">
							<h3 className="text-lg font-semibold text-gray-900">
								用户列表
								{loading && <span className="text-sm text-gray-500 ml-2">加载中...</span>}
							</h3>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户ID</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配置状态</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据源</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">流量使用</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后修改时间</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{loading && filteredUsers.length === 0 && (
										<tr>
											<td colSpan={6} className="px-6 py-4 text-center text-gray-500">
												正在加载用户数据...
											</td>
										</tr>
									)}

									{!loading && filteredUsers.length === 0 && !error && (
										<tr>
											<td colSpan={6} className="px-6 py-4 text-center text-gray-500">
												暂无用户数据
											</td>
										</tr>
									)}

									{filteredUsers.map((user) => (
										<tr key={user.uid} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">{user.uid}</div>
												{user.subscribeUrl && (
													<div className="text-xs text-gray-500 truncate max-w-32" title={user.subscribeUrl}>
														{user.subscribeUrl}
													</div>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span
													className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
														user.hasConfig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
													}`}
												>
													{user.hasConfig ? '已配置' : '未配置'}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceClass(user.source)}`}>
													{getSourceText(user.source)}
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
																	user.trafficInfo.usagePercent > 90
																		? 'bg-red-500'
																		: user.trafficInfo.usagePercent > 70
																		? 'bg-yellow-500'
																		: 'bg-green-500'
																}`}
																style={{ width: `${Math.min(user.trafficInfo.usagePercent, 100)}%` }}
															/>
														</div>
														<div className="text-xs text-gray-500">{user.trafficInfo.usagePercent.toFixed(1)}%</div>
													</div>
												) : (
													<span className="text-gray-400">无数据</span>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(user.lastModified)}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
												<div className="flex space-x-2">
													<button
														onClick={() => handleUserAction('view', user.uid, user.token)}
														className="text-indigo-600 hover:text-indigo-900"
													>
														查看
													</button>
													<button onClick={() => handleUserAction('refresh', user.uid)} className="text-green-600 hover:text-green-900">
														刷新
													</button>
													<button onClick={() => handleUserAction('delete', user.uid)} className="text-red-600 hover:text-red-900">
														删除
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* 分页信息 */}
					<div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
						<div className="flex items-center text-sm text-gray-700">
							<span>
								显示 1-{filteredUsers.length} 条，共 {filteredUsers.length} 条记录
							</span>
						</div>
						<div className="flex space-x-2">
							<button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50" disabled>
								上一页
							</button>
							<button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
							<button className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50" disabled>
								下一页
							</button>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
