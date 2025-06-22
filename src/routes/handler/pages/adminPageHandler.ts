import { RouteHandler } from '@/types/routes.types';

export class AdminPageHandler implements RouteHandler {
	canHandle(request: Request): boolean {
		const url = new URL(request.url);
		return url.pathname.startsWith('/admin/');
	}

	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// 验证超级管理员权限
		const token = url.searchParams.get('superToken');
		if (!token || token !== env.SUPER_ADMIN_TOKEN) {
			return this.createUnauthorizedResponse();
		}

		// 路由分发
		switch (true) {
			case path === '/admin/dashboard':
				return this.getDashboardPage();
			case path === '/admin/users':
				return this.getUsersPage();
			case path === '/admin/monitor':
				return this.getMonitorPage();
			case path === '/admin/templates':
				return this.getTemplatesPage();
			default:
				return this.getDashboardPage(); // 默认返回控制台
		}
	}

	private getDashboardPage(): Response {
		const html = `
		<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>超级管理员 - 控制台</title>
			<script src="https://cdn.tailwindcss.com"></script>
			<script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
			<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
		</head>
		<body class="bg-gray-100">
			<div x-data="adminDashboard()" class="min-h-screen">
				<!-- 导航栏 -->
				<nav class="bg-blue-800 text-white p-4">
					<div class="max-w-7xl mx-auto flex justify-between items-center">
						<h1 class="text-xl font-bold">超级管理员控制台</h1>
						<div class="space-x-4">
							<a href="#" onclick="navigateWithToken('/admin/dashboard')" class="hover:underline">控制台</a>
							<a href="#" onclick="navigateWithToken('/admin/users')" class="hover:underline">用户管理</a>
							<a href="#" onclick="navigateWithToken('/admin/monitor')" class="hover:underline">系统监控</a>
							<a href="#" onclick="navigateWithToken('/admin/templates')" class="hover:underline">配置模板</a>
						</div>
					</div>
				</nav>

				<!-- 主要内容 -->
				<main class="max-w-7xl mx-auto p-6">
					<!-- 统计卡片 -->
					<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
						<div class="bg-white p-6 rounded-lg shadow">
							<h3 class="text-sm font-medium text-gray-500">总用户数</h3>
							<p class="text-2xl font-bold text-gray-900" x-text="stats.totalUsers">-</p>
						</div>
						<div class="bg-white p-6 rounded-lg shadow">
							<h3 class="text-sm font-medium text-gray-500">活跃用户</h3>
							<p class="text-2xl font-bold text-green-600" x-text="stats.activeUsers">-</p>
						</div>
						<div class="bg-white p-6 rounded-lg shadow">
							<h3 class="text-sm font-medium text-gray-500">KV配置用户</h3>
							<p class="text-2xl font-bold text-blue-600" x-text="stats.kvConfigUsers">-</p>
						</div>
						<div class="bg-white p-6 rounded-lg shadow">
							<h3 class="text-sm font-medium text-gray-500">配置完成率</h3>
							<p class="text-2xl font-bold text-purple-600" x-text="stats.configCompleteRate + '%'">-</p>
						</div>
					</div>

					<!-- 最近活动 -->
					<div class="bg-white rounded-lg shadow">
						<div class="p-6 border-b border-gray-200">
							<h2 class="text-lg font-medium text-gray-900">最近活动</h2>
						</div>
						<div class="p-6">
							<div x-show="logs.length === 0" class="text-gray-500 text-center">暂无活动记录</div>
							<div x-show="logs.length > 0" class="space-y-4">
								<template x-for="log in logs.slice(0, 10)" :key="log.timestamp">
									<div class="flex items-center justify-between p-4 bg-gray-50 rounded">
										<div>
											<p class="text-sm font-medium text-gray-900" x-text="log.operation"></p>
											<p class="text-xs text-gray-500" x-text="log.details"></p>
										</div>
										<div class="text-xs text-gray-400" x-text="new Date(log.timestamp).toLocaleString()"></div>
									</div>
								</template>
							</div>
						</div>
					</div>
				</main>
			</div>

			<script>
			// 导航辅助函数
			function navigateWithToken(path) {
				const token = new URLSearchParams(window.location.search).get('superToken');
				window.location.href = path + '?superToken=' + token;
			}
			
			function adminDashboard() {
				return {
					stats: {
						totalUsers: 0,
						activeUsers: 0,
						kvConfigUsers: 0,
						configCompleteRate: 0
					},
					logs: [],
					
					async init() {
						await this.loadStats();
						await this.loadLogs();
					},
					
					async loadStats() {
						try {
							const token = new URLSearchParams(window.location.search).get('superToken');
							const response = await fetch('/api/admin/stats?superToken=' + token);
							const result = await response.json();
							if (result.success) {
								this.stats = result.data;
							}
						} catch (error) {
							console.error('加载统计数据失败:', error);
						}
					},
					
					async loadLogs() {
						try {
							const token = new URLSearchParams(window.location.search).get('superToken');
							const response = await fetch('/api/admin/logs?superToken=' + token + '&limit=10');
							const result = await response.json();
							if (result.success) {
								this.logs = result.data.logs;
							}
						} catch (error) {
							console.error('加载日志失败:', error);
						}
					}
				}
			}
			</script>
		</body>
		</html>
		`;

		return new Response(html, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	private getUsersPage(): Response {
		const html = `
		<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>用户管理 - 超级管理员</title>
			<script src="https://cdn.tailwindcss.com"></script>
			<script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
		</head>
		<body class="bg-gray-100">
			<div x-data="userManagement()" class="min-h-screen">
				<!-- 导航栏 -->
				<nav class="bg-blue-800 text-white p-4">
					<div class="max-w-7xl mx-auto flex justify-between items-center">
						<h1 class="text-xl font-bold">用户管理</h1>
						<div class="space-x-4">
							<a href="#" onclick="navigateWithToken('/admin/dashboard')" class="hover:underline">控制台</a>
							<a href="#" onclick="navigateWithToken('/admin/users')" class="hover:underline font-bold">用户管理</a>
							<a href="#" onclick="navigateWithToken('/admin/monitor')" class="hover:underline">系统监控</a>
							<a href="#" onclick="navigateWithToken('/admin/templates')" class="hover:underline">配置模板</a>
						</div>
					</div>
				</nav>

				<!-- 主要内容 -->
				<main class="max-w-7xl mx-auto p-6">
					<!-- 操作栏 -->
					<div class="bg-white p-4 rounded-lg shadow mb-6">
						<div class="flex justify-between items-center">
							<div class="flex space-x-4">
								<button @click="refreshUsers()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
									刷新列表
								</button>
								<button @click="showCreateModal = true" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
									新增用户
								</button>
							</div>
							<div class="flex items-center space-x-2">
								<span class="text-sm text-gray-600">共 <span x-text="users.length"></span> 个用户</span>
							</div>
						</div>
					</div>

					<!-- 用户列表 -->
					<div class="bg-white rounded-lg shadow overflow-hidden">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户ID</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配置来源</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">流量使用</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后修改</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								<template x-for="user in users" :key="user.userId">
									<tr>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" x-text="user.userId"></td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
												  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
												  x-text="user.isActive ? '活跃' : '非活跃'">
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="user.source"></td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											<div x-show="user.trafficInfo">
												<div class="flex flex-col">
													<div class="flex items-center">
														<span class="text-xs font-medium mr-2">已用:</span>
														<span x-text="formatBytes(user.trafficInfo?.used || 0)" class="text-xs"></span>
														<span class="text-xs text-gray-400 mx-1">/</span>
														<span x-text="formatBytes(user.trafficInfo?.total || 0)" class="text-xs"></span>
													</div>
													<div class="w-full bg-gray-200 rounded-full h-2 mt-1">
														<div class="bg-blue-600 h-2 rounded-full" 
															 :style="'width: ' + Math.min((user.trafficInfo?.usagePercent || 0), 100) + '%'"></div>
													</div>
													<div class="text-xs text-gray-500 mt-1">
														<span x-text="(user.trafficInfo?.usagePercent || 0).toFixed(1) + '%'"></span>
														<span x-show="user.trafficInfo?.isExpired" class="text-red-500 ml-2">已过期</span>
													</div>
												</div>
											</div>
											<div x-show="!user.trafficInfo" class="text-xs text-gray-400">
												无流量信息
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" 
											x-text="user.lastModified ? new Date(user.lastModified).toLocaleString() : '-'"></td>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											<button @click="viewUser(user)" class="text-blue-600 hover:text-blue-900">查看</button>
											<button @click="editUser(user)" class="text-green-600 hover:text-green-900">编辑</button>
											<button @click="refreshTraffic(user)" class="text-purple-600 hover:text-purple-900" 
													x-show="user.subscribeUrl">刷新</button>
											<button @click="deleteUser(user)" class="text-red-600 hover:text-red-900">删除</button>
										</td>
									</tr>
								</template>
							</tbody>
						</table>
					</div>
				</main>
			</div>

			<script>
			// 导航辅助函数
			function navigateWithToken(path) {
				const token = new URLSearchParams(window.location.search).get('superToken');
				window.location.href = path + '?superToken=' + token;
			}
			
			function userManagement() {
				return {
					users: [],
					showCreateModal: false,
					
					getToken() {
						return new URLSearchParams(window.location.search).get('superToken');
					},
					
					async init() {
						await this.refreshUsers();
					},
					
					async refreshUsers() {
						try {
							const response = await fetch('/api/admin/users?superToken=' + this.getToken());
							const result = await response.json();
							if (result.success) {
								this.users = result.data.users;
							}
						} catch (error) {
							console.error('加载用户列表失败:', error);
							alert('加载用户列表失败');
						}
					},
					
					formatBytes(bytes) {
						if (bytes === 0) return '0 Bytes';
						const k = 1024;
						const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
						const i = Math.floor(Math.log(bytes) / Math.log(k));
						return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
					},
					
					viewUser(user) {
						// 简化实现 - 显示用户详情
						alert('查看用户: ' + JSON.stringify(user));
					},
					
					editUser(user) {
						// 简化实现 - 编辑用户
						alert('编辑用户: ' + user.userId);
					},
					
					async refreshTraffic(user) {
						try {
							const response = await fetch('/api/admin/users/' + user.userId + '/traffic/refresh?superToken=' + this.getToken(), {
								method: 'POST'
							});
							const result = await response.json();
							if (result.success) {
								// 更新用户的流量信息
								const userIndex = this.users.findIndex(u => u.userId === user.userId);
								if (userIndex !== -1) {
									this.users[userIndex].trafficInfo = result.data.trafficInfo;
								}
								alert('流量信息刷新成功');
							} else {
								alert('刷新失败: ' + result.error);
							}
						} catch (error) {
							console.error('刷新流量信息失败:', error);
							alert('刷新流量信息失败');
						}
					},
					
					async deleteUser(user) {
						if (!confirm('确定要删除用户 ' + user.userId + ' 吗？')) {
							return;
						}
						
						try {
							const response = await fetch('/api/admin/users/' + user.userId + '?superToken=' + this.getToken(), {
								method: 'DELETE'
							});
							const result = await response.json();
							if (result.success) {
								alert('用户删除成功');
								await this.refreshUsers();
							} else {
								alert('删除失败: ' + result.error);
							}
						} catch (error) {
							console.error('删除用户失败:', error);
							alert('删除用户失败');
						}
					}
				}
			}
			</script>
		</body>
		</html>
		`;

		return new Response(html, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	private getMonitorPage(): Response {
		const html = `
		<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>系统监控 - 超级管理员</title>
			<script src="https://cdn.tailwindcss.com"></script>
			<script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
		</head>
		<body class="bg-gray-100">
			<div class="min-h-screen">
				<!-- 导航栏 -->
				<nav class="bg-blue-800 text-white p-4">
					<div class="max-w-7xl mx-auto flex justify-between items-center">
						<h1 class="text-xl font-bold">系统监控</h1>
						<div class="space-x-4">
							<a href="#" onclick="navigateWithToken('/admin/dashboard')" class="hover:underline">控制台</a>
							<a href="#" onclick="navigateWithToken('/admin/users')" class="hover:underline">用户管理</a>
							<a href="#" onclick="navigateWithToken('/admin/monitor')" class="hover:underline font-bold">系统监控</a>
							<a href="#" onclick="navigateWithToken('/admin/templates')" class="hover:underline">配置模板</a>
						</div>
					</div>
				</nav>

				<!-- 主要内容 -->
				<main class="max-w-7xl mx-auto p-6">
					<div class="bg-white p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">系统状态</h2>
						<div class="text-center text-gray-500">
							<p>监控功能开发中...</p>
						</div>
					</div>
				</main>
			</div>
		</body>
		</html>
		`;

		return new Response(html, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	private getTemplatesPage(): Response {
		const html = `
		<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>配置模板 - 超级管理员</title>
			<script src="https://cdn.tailwindcss.com"></script>
			<script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
		</head>
		<body class="bg-gray-100">
			<div class="min-h-screen">
				<!-- 导航栏 -->
				<nav class="bg-blue-800 text-white p-4">
					<div class="max-w-7xl mx-auto flex justify-between items-center">
						<h1 class="text-xl font-bold">配置模板</h1>
						<div class="space-x-4">
							<a href="#" onclick="navigateWithToken('/admin/dashboard')" class="hover:underline">控制台</a>
							<a href="#" onclick="navigateWithToken('/admin/users')" class="hover:underline">用户管理</a>
							<a href="#" onclick="navigateWithToken('/admin/monitor')" class="hover:underline">系统监控</a>
							<a href="#" onclick="navigateWithToken('/admin/templates')" class="hover:underline font-bold">配置模板</a>
						</div>
					</div>
				</nav>

				<!-- 主要内容 -->
				<main class="max-w-7xl mx-auto p-6">
					<div class="bg-white p-6 rounded-lg shadow">
						<h2 class="text-lg font-medium text-gray-900 mb-4">配置模板管理</h2>
						<div class="text-center text-gray-500">
							<p>模板管理功能开发中...</p>
						</div>
					</div>
				</main>
			</div>
		</body>
		</html>
		`;

		return new Response(html, {
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	private createUnauthorizedResponse(): Response {
		const html = `
		<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>访问被拒绝</title>
			<script src="https://cdn.tailwindcss.com"></script>
		</head>
		<body class="bg-gray-100">
			<div class="min-h-screen flex items-center justify-center">
				<div class="bg-white p-8 rounded-lg shadow-md text-center">
					<h1 class="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h1>
					<p class="text-gray-600 mb-4">您没有权限访问超级管理员界面</p>
					<p class="text-sm text-gray-500">请检查您的超级管理员令牌是否正确</p>
				</div>
			</div>
		</body>
		</html>
		`;

		return new Response(html, {
			status: 401,
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}
} 