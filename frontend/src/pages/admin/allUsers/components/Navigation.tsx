export interface NavigationProps {
	superToken: string;
}

/**
 * 管理员页面导航栏组件
 */
export function Navigation({ superToken }: NavigationProps) {
	return (
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
	);
} 