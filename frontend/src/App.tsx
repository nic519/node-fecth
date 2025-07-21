import { AdminUsers } from '@/pages/admin/allUsers/Users';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminMonitor } from '@/pages/admin/Monitor';
import { AdminTemplates } from '@/pages/admin/Templates';
import { NotFound } from '@/pages/NotFound';
import { UserConfigPage } from '@/pages/userConfig/UserConfigPage';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function Home() {
	// 检查是否有管理员 token
	const superToken = new URLSearchParams(window.location.search).get('superToken');
	if (superToken) {
		return <Navigate to={`/admin/dashboard?superToken=${superToken}`} replace />;
	}

	// 显示说明页面
	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center">
			<div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">节点管理后台</h1>
				<div className="space-y-4">
					<div>
						<h2 className="font-semibold text-gray-700">用户配置管理</h2>
						<p className="text-sm text-gray-600">
							访问: <code className="bg-gray-100 px-1 rounded">/config/用户ID?token=访问令牌</code>
						</p>
					</div>
					<div>
						<h2 className="font-semibold text-gray-700">管理员控制台</h2>
						<p className="text-sm text-gray-600">
							访问: <code className="bg-gray-100 px-1 rounded">/admin/dashboard?superToken=管理员令牌</code>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export function App() {
	return (
		<Router>
			<Routes>
				{/* 默认页面 */}
				<Route path="/" element={<Home />} />

				{/* 用户配置页面 */}
				<Route path="/config/:uid" element={<UserConfigPage />} />

				{/* 管理员页面 */}
				<Route path="/admin/dashboard" element={<AdminDashboard />} />
				<Route path="/admin/users" element={<AdminUsers />} />
				<Route path="/admin/monitor" element={<AdminMonitor />} />
				<Route path="/admin/templates" element={<AdminTemplates />} />

				{/* 404 页面 */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</Router>
	);
}
