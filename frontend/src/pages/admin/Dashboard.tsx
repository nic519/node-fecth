import { useEffect, useState } from 'react';
// 直接使用类型安全的原始函数（Hono 最佳实践）
import { NavigationBar } from '@/components/NavigationBar';
import { getApiHealth } from '@/generated/api-adapters.g';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { AdminStats } from '@/types/user-config';

export function AdminDashboard() {
	// 设置页面标题
	usePageTitle('控制台');

	const [stats, setStats] = useState<AdminStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const superToken = new URLSearchParams(window.location.search).get('superToken') || '';

	useEffect(() => {
		if (!superToken) {
			setError('缺少管理员令牌');
			setLoading(false);
			return;
		}
		loadStats();
	}, [superToken]);

	const loadStats = async () => {
		try {
			setLoading(true);
			// 使用健康检查API作为基础状态信息
			const healthResponse = await getApiHealth();

			// 检查业务响应码
			if (healthResponse.code !== 0) {
				setError('获取系统状态失败');
				return;
			}

			// 基于健康检查生成基本统计数据
			const basicStats = {
				totalUsers: 0,
				activeUsers: 0,
				todayRequests: 0,
				systemStatus: healthResponse.data.status,
				totalTraffic: '0 MB',
				todayTraffic: '0 MB',
				serverNodes: 1,
				uptime: '0h 0m',
				timestamp: healthResponse.data.timestamp,
			};

			setStats(basicStats);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : '加载统计数据失败');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
					<p className="mt-4 text-gray-600">加载中...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
					<h1 className="text-2xl font-bold text-red-600 mb-4">错误</h1>
					<p className="text-gray-600 mb-4">{error}</p>
					<button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
						重试
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* 顶部导航 */}
			<NavigationBar superToken={superToken} currentPage="dashboard" />

			{/* 主内容 */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">控制台概览</h2>

					{/* 统计卡片 */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">👥</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">总用户数</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">✅</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">活跃用户</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.activeUsers || 0}</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">📊</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">今日请求</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.todayRequests || 0}</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">⚡</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">系统状态</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.systemStatus || '正常'}</p>
								</div>
							</div>
						</div>
					</div>

					{/* 第二排统计卡片 */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">💾</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">总流量</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.totalTraffic || 'N/A'}</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">📈</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">今日流量</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.todayTraffic || 'N/A'}</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">🌐</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">服务器节点</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.serverNodes || 0}</p>
								</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
										<span className="text-white font-bold">⏱️</span>
									</div>
								</div>
								<div className="ml-4">
									<p className="text-sm font-medium text-gray-500">运行时间</p>
									<p className="text-2xl font-bold text-gray-900">{stats?.uptime || 'N/A'}</p>
								</div>
							</div>
						</div>
					</div>

					{/* 快速操作和最近活动 */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<div className="bg-white rounded-lg shadow">
							<div className="px-6 py-4 border-b border-gray-200">
								<h3 className="text-lg font-medium text-gray-900">最近活动</h3>
							</div>
							<div className="p-6">
								<div className="text-center text-gray-500 py-4">暂无活动记录</div>
							</div>
						</div>

						<div className="bg-white rounded-lg shadow">
							<div className="px-6 py-4 border-b border-gray-200">
								<h3 className="text-lg font-medium text-gray-900">快速操作</h3>
							</div>
							<div className="p-6">
								<div className="space-y-3">
									<button
										onClick={() => window.location.reload()}
										className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-center">
											<span className="mr-3 text-xl">🔄</span>
											<div>
												<p className="font-medium text-gray-900">刷新统计数据</p>
												<p className="text-sm text-gray-500">更新所有统计信息</p>
											</div>
										</div>
									</button>

									<a
										href={`/admin/users?superToken=${superToken}`}
										className="block w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-center">
											<span className="mr-3 text-xl">👥</span>
											<div>
												<p className="font-medium text-gray-900">管理用户</p>
												<p className="text-sm text-gray-500">查看和管理所有用户</p>
											</div>
										</div>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
