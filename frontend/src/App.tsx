import { AdminUsers } from '@/pages/admin/allUsers/Users';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminTemplates } from '@/pages/admin/Templates';
import { Home } from '@/pages/Home';
import { NotFound } from '@/pages/NotFound';
import { UserConfigPage } from '@/pages/userConfig/UserConfigPage';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { HeroUIProviderWrapper } from '@/providers/heroui-provider';

export function App() {
	return (
		<HeroUIProviderWrapper>
			<Router>
				<Routes>
					{/* 默认页面 */}
					<Route path="/" element={<Home />} />

					{/* 用户配置页面 */}
					<Route path="/config" element={<UserConfigPage />} />

					{/* 管理员页面 */}
					<Route path="/admin/dashboard" element={<AdminDashboard />} />
					<Route path="/admin/users" element={<AdminUsers />} />
					<Route path="/admin/templates" element={<AdminTemplates />} />

					{/* 404 页面 */}
					<Route path="*" element={<NotFound />} />
				</Routes>
			</Router>
		</HeroUIProviderWrapper>
	);
}
