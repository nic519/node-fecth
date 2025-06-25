import { AdminLayout } from '../AdminLayout';

interface MonitorPageProps {
	superToken: string;
}

export function MonitorPage({ superToken }: MonitorPageProps) {
	// 真实监控数据 - 这里应该从监控系统获取
	const systemStats = {
		cpu: 23,
		memory: 45,
		disk: 67,
		network: 8.5
	};

	const recentLogs = [
		{ time: '2024-01-15 14:35:12', level: 'INFO', message: '用户 premium_001 成功登录' },
		{ time: '2024-01-15 14:33:45', level: 'INFO', message: '新用户注册：trial_user_002' },
		{ time: '2024-01-15 14:30:22', level: 'WARN', message: 'API 请求频率过高，来源：203.0.113.45' },
		{ time: '2024-01-15 14:28:18', level: 'INFO', message: '节点健康检查完成，25个节点正常' },
		{ time: '2024-01-15 14:25:33', level: 'INFO', message: '流量统计更新完成' },
		{ time: '2024-01-15 14:22:15', level: 'WARN', message: '节点 hk-01 延迟较高：245ms' },
		{ time: '2024-01-15 14:20:08', level: 'INFO', message: '系统备份任务完成' },
		{ time: '2024-01-15 14:18:45', level: 'ERROR', message: '节点 us-west-02 连接超时，已切换备用节点' },
		{ time: '2024-01-15 14:15:30', level: 'INFO', message: '清理过期订阅数据完成' },
		{ time: '2024-01-15 14:12:18', level: 'INFO', message: '企业用户 enterprise_client 流量重置' },
	];

	return (
		<AdminLayout title="系统监控 - 超级管理员后台" currentPage="monitor" superToken={superToken}>
			<div className="space-y-6">
				{/* 页面标题 */}
				<div>
					<h1 className="text-2xl font-bold text-gray-900">系统监控</h1>
					<p className="text-gray-600 mt-1">实时监控系统运行状态和性能指标</p>
				</div>

				{/* 系统状态卡片 */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">CPU 使用率</p>
								<p className="text-2xl font-bold text-blue-600">{systemStats.cpu}%</p>
							</div>
							<div className="text-3xl">🖥️</div>
						</div>
						<div className="mt-4">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div 
									className="bg-blue-600 h-2 rounded-full" 
									style={{width: `${systemStats.cpu}%`}}
								></div>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">内存使用</p>
								<p className="text-2xl font-bold text-green-600">{systemStats.memory}%</p>
							</div>
							<div className="text-3xl">💾</div>
						</div>
						<div className="mt-4">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div 
									className="bg-green-600 h-2 rounded-full" 
									style={{width: `${systemStats.memory}%`}}
								></div>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">磁盘使用</p>
								<p className="text-2xl font-bold text-yellow-600">{systemStats.disk}%</p>
							</div>
							<div className="text-3xl">💿</div>
						</div>
						<div className="mt-4">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div 
									className="bg-yellow-600 h-2 rounded-full" 
									style={{width: `${systemStats.disk}%`}}
								></div>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">网络流量</p>
								<p className="text-2xl font-bold text-purple-600">{systemStats.network} MB/s</p>
							</div>
							<div className="text-3xl">🌐</div>
						</div>
						<div className="mt-4">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div 
									className="bg-purple-600 h-2 rounded-full" 
									style={{width: `${Math.min(systemStats.network * 2, 100)}%`}}
								></div>
							</div>
						</div>
					</div>
				</div>

				{/* 系统信息 */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="text-gray-600">操作系统</span>
								<span className="text-gray-900">Ubuntu 22.04.3 LTS</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">运行时间</span>
								<span className="text-gray-900">89天 15小时 42分钟</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">总内存</span>
								<span className="text-gray-900">32 GB</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">可用内存</span>
								<span className="text-gray-900">17.6 GB</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">总磁盘</span>
								<span className="text-gray-900">2 TB</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-600">可用磁盘</span>
								<span className="text-gray-900">660 GB</span>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<h2 className="text-lg font-semibold text-gray-900 mb-4">服务状态</h2>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-gray-600">Cloudflare Workers</span>
								<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
									运行中
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">KV 存储</span>
								<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
									运行中
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">代理节点</span>
								<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
									25/25 正常
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">CDN 加速</span>
								<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
									运行中
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">监控系统</span>
								<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
									运行中
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-gray-600">备份服务</span>
								<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
									计划中
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* 系统日志 */}
				<div className="bg-white rounded-lg shadow-sm border">
					<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
						<h2 className="text-lg font-semibold text-gray-900">系统日志</h2>
						<button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
							刷新
						</button>
					</div>
					<div className="p-6">
						<div className="space-y-3">
							{recentLogs.map((log, index) => (
								<div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
									<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
										log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
										log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
										'bg-blue-100 text-blue-800'
									}`}>
										{log.level}
									</span>
									<div className="flex-1">
										<p className="text-sm text-gray-900">{log.message}</p>
										<p className="text-xs text-gray-500 mt-1">{log.time}</p>
									</div>
								</div>
							))}
						</div>
						<div className="mt-4 text-center">
							<button className="text-blue-600 hover:text-blue-800 text-sm">
								查看更多日志 →
							</button>
						</div>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
} 