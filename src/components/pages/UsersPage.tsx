import { AdminLayout } from '../AdminLayout';

interface UsersPageProps {
	superToken: string;
}

export function UsersPage({ superToken }: UsersPageProps) {
	// 真实用户数据 - 这里应该从数据库获取，暂时使用模拟数据
	const users = [
		{ 
			id: 1, 
			username: 'admin_user', 
			email: 'admin@clash-proxy.com', 
			status: '活跃', 
			lastLogin: '2024-01-15 14:30:25',
			role: '管理员',
			subscriptions: 3,
			traffic: '15.2 GB / 100 GB'
		},
		{ 
			id: 2, 
			username: 'premium_001', 
			email: 'premium001@example.com', 
			status: '活跃', 
			lastLogin: '2024-01-15 10:22:18',
			role: '高级用户',
			subscriptions: 5,
			traffic: '45.8 GB / 500 GB'
		},
		{ 
			id: 3, 
			username: 'basic_user_001', 
			email: 'basic001@example.com', 
			status: '活跃', 
			lastLogin: '2024-01-14 16:45:12',
			role: '普通用户',
			subscriptions: 1,
			traffic: '2.1 GB / 10 GB'
		},
		{ 
			id: 4, 
			username: 'enterprise_client', 
			email: 'enterprise@company.com', 
			status: '活跃', 
			lastLogin: '2024-01-15 09:15:33',
			role: '企业用户',
			subscriptions: 50,
			traffic: '1.2 TB / 5 TB'
		},
		{ 
			id: 5, 
			username: 'suspended_user', 
			email: 'suspended@example.com', 
			status: '禁用', 
			lastLogin: '2024-01-10 08:30:45',
			role: '普通用户',
			subscriptions: 1,
			traffic: '8.9 GB / 10 GB'
		},
		{ 
			id: 6, 
			username: 'trial_user_001', 
			email: 'trial001@example.com', 
			status: '试用', 
			lastLogin: '2024-01-15 12:18:27',
			role: '试用用户',
			subscriptions: 1,
			traffic: '0.5 GB / 1 GB'
		},
	];

	return (
		<AdminLayout title="用户管理 - 超级管理员后台" currentPage="users" superToken={superToken}>
			<div className="space-y-6">
				{/* 页面标题和操作按钮 */}
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
						<p className="text-gray-600 mt-1">管理系统中的所有用户账户</p>
					</div>
					<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
						+ 添加用户
					</button>
				</div>

				{/* 搜索和筛选 */}
				<div className="bg-white p-4 rounded-lg shadow-sm border">
					<div className="flex gap-4">
						<div className="flex-1">
							<input 
								type="text" 
								placeholder="搜索用户名或邮箱..." 
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
						<select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
							<option value="">所有状态</option>
							<option value="active">活跃</option>
							<option value="disabled">禁用</option>
						</select>
						<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
							搜索
						</button>
					</div>
				</div>

				{/* 用户列表 */}
				<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">用户列表</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										用户ID
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										用户名
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										邮箱
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										角色
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										状态
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										订阅数
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										流量使用
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										最后登录
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										操作
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{users.map((user) => (
									<tr key={user.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											#{user.id.toString().padStart(4, '0')}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">{user.username}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{user.email}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												user.role === '管理员' ? 'bg-purple-100 text-purple-800' :
												user.role === '企业用户' ? 'bg-blue-100 text-blue-800' :
												user.role === '高级用户' ? 'bg-yellow-100 text-yellow-800' :
												user.role === '试用用户' ? 'bg-orange-100 text-orange-800' :
												'bg-gray-100 text-gray-800'
											}`}>
												{user.role}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												user.status === '活跃' ? 'bg-green-100 text-green-800' :
												user.status === '试用' ? 'bg-blue-100 text-blue-800' :
												'bg-red-100 text-red-800'
											}`}>
												{user.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{user.subscriptions}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											<div className="text-sm text-gray-900">{user.traffic}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{user.lastLogin}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex space-x-2">
												<button className="text-blue-600 hover:text-blue-900">编辑</button>
												<button className="text-green-600 hover:text-green-900">配置</button>
												<button className="text-gray-600 hover:text-gray-900">
													{user.status === '活跃' ? '禁用' : '启用'}
												</button>
												{user.role !== '管理员' && (
													<button className="text-red-600 hover:text-red-900">删除</button>
												)}
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
						<span>显示 1-{users.length} 条，共 {users.length} 条记录</span>
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
		</AdminLayout>
	);
} 