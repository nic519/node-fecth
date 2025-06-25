import type { FC } from 'hono/jsx'

interface NavigationProps {
	currentPage: string
	superToken: string
}

interface NavigationItem {
	name: string
	path: string
	icon: string
}

const navigationItems: NavigationItem[] = [
	{
		name: '控制台',
		path: '/admin/dashboard',
		icon: '📊'
	},
	{
		name: '用户管理',
		path: '/admin/users',
		icon: '👥'
	},
	{
		name: '系统监控',
		path: '/admin/monitor',
		icon: '📈'
	},
	{
		name: '配置模板',
		path: '/admin/templates',
		icon: '🛠️'
	}
]

export const Navigation: FC<NavigationProps> = ({ currentPage, superToken }) => {
	return (
		<nav class="bg-white shadow-lg fixed left-0 top-0 h-full w-64 overflow-y-auto">
			<div class="p-6">
				<h1 class="text-2xl font-bold text-gray-800">超级管理员</h1>
				<p class="text-sm text-gray-600 mt-2">系统管理控制台</p>
			</div>
			
			<div class="px-6 py-4">
				<ul class="space-y-2">
					{navigationItems.map((item) => {
						const isActive = currentPage === item.path
						const linkClasses = isActive
							? "flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-lg font-medium"
							: "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
						
						return (
							<li key={item.path}>
								<a 
									href={`${item.path}?superToken=${superToken}`}
									class={linkClasses}
								>
									<span class="mr-3 text-xl">{item.icon}</span>
									{item.name}
								</a>
							</li>
						)
					})}
				</ul>
			</div>
		</nav>
	)
} 