import type { FC } from 'hono/jsx'
import { AdminLayout } from '../AdminLayout'

interface DashboardStats {
	totalUsers: number
	activeUsers: number
	todayRequests: number
	systemStatus: string
	totalTraffic: string
	todayTraffic: string
	serverNodes: number
	uptime: string
}

interface DashboardPageProps {
	stats: DashboardStats
	superToken: string
}

export const DashboardPage: FC<DashboardPageProps> = ({ stats, superToken }) => {
	return (
		<AdminLayout title="控制台" currentPage="/admin/dashboard" superToken={superToken}>
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">控制台概览</h1>
				<p class="text-gray-600">欢迎使用超级管理员控制台</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">👥</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">总用户数</p>
							<p class="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">✅</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">活跃用户</p>
							<p class="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">📊</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">今日请求</p>
							<p class="text-2xl font-bold text-gray-900">{stats.todayRequests}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">⚡</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">系统状态</p>
							<p class="text-2xl font-bold text-gray-900">{stats.systemStatus}</p>
						</div>
					</div>
				</div>
			</div>

			{/* 第二排统计卡片 */}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">💾</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">总流量</p>
							<p class="text-2xl font-bold text-gray-900">{stats.totalTraffic}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">📈</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">今日流量</p>
							<p class="text-2xl font-bold text-gray-900">{stats.todayTraffic}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">🌐</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">服务器节点</p>
							<p class="text-2xl font-bold text-gray-900">{stats.serverNodes}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
								<span class="text-white font-bold">⏱️</span>
							</div>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">运行时间</p>
							<p class="text-2xl font-bold text-gray-900">{stats.uptime}</p>
						</div>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div class="bg-white rounded-lg shadow">
					<div class="px-6 py-4 border-b border-gray-200">
						<h3 class="text-lg font-medium text-gray-900">最近活动</h3>
					</div>
					<div class="p-6">
						<div class="text-center text-gray-500 py-4">
							暂无活动记录
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow">
					<div class="px-6 py-4 border-b border-gray-200">
						<h3 class="text-lg font-medium text-gray-900">快速操作</h3>
					</div>
					<div class="p-6">
						<div class="space-y-3">
							<button 
								onclick="window.location.reload()"
								class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
							>
								<div class="flex items-center">
									<span class="mr-3 text-xl">🔄</span>
									<div>
										<p class="font-medium text-gray-900">刷新统计数据</p>
										<p class="text-sm text-gray-500">更新所有统计信息</p>
									</div>
								</div>
							</button>

							<a 
								href={`/admin/users?superToken=${superToken}`}
								class="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
							>
								<div class="flex items-center">
									<span class="mr-3 text-xl">👥</span>
									<div>
										<p class="font-medium text-gray-900">管理用户</p>
										<p class="text-sm text-gray-500">查看和管理所有用户</p>
									</div>
								</div>
							</a>

							<a 
								href={`/admin/monitor?superToken=${superToken}`}
								class="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
							>
								<div class="flex items-center">
									<span class="mr-3 text-xl">📈</span>
									<div>
										<p class="font-medium text-gray-900">系统监控</p>
										<p class="text-sm text-gray-500">查看系统运行状态</p>
									</div>
								</div>
							</a>
						</div>
					</div>
				</div>
			</div>
		</AdminLayout>
	)
} 