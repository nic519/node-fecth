export interface NavigationBarProps {
	superToken: string;
	currentPage?: 'dashboard' | 'users' | 'templates';
	title?: string;
}

/**
 * 管理员页面通用导航栏组件
 */
export function NavigationBar({ superToken, currentPage, title }: NavigationBarProps) {
	// 根据当前页面设置标题
	const pageTitle = title ||
		(currentPage === 'dashboard' ? '控制台' :
		currentPage === 'users' ? '用户管理' :
		currentPage === 'templates' ? '配置模板' : '管理员控制台');

	return (
		<nav className="bg-white shadow">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex items-center">
						<h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
					</div>
					<div className="flex items-center space-x-4">
						<a
							href={`/admin/dashboard?superToken=${superToken}`}
							className={`px-3 py-2 rounded-md text-sm font-medium ${
								currentPage === 'dashboard'
									? 'text-blue-600 bg-blue-50'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							控制台
						</a>
						<a
							href={`/admin/users?superToken=${superToken}`}
							className={`px-3 py-2 rounded-md text-sm font-medium ${
								currentPage === 'users'
									? 'text-blue-600 bg-blue-50'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							用户管理
						</a>
						<a
							href={`/admin/templates?superToken=${superToken}`}
							className={`px-3 py-2 rounded-md text-sm font-medium ${
								currentPage === 'templates'
									? 'text-blue-600 bg-blue-50'
									: 'text-gray-600 hover:text-gray-900'
							}`}
						>
							配置模板
						</a>
					</div>
				</div>
			</div>
		</nav>
	);
}