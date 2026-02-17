import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, Home } from 'lucide-react';

export interface NavigationBarProps {
	superToken: string;
	currentPage?: 'dashboard' | 'users' | 'templates';
	title?: string;
}

export const AcmeLogo = () => {
	return (
		<svg fill="none" height="36" viewBox="0 0 32 32" width="36" className="text-blue-600">
			<path
				clipRule="evenodd"
				d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	);
};

export function NavigationBar({ superToken, currentPage, title }: NavigationBarProps) {
	const pageTitle =
		title ||
		(currentPage === 'dashboard'
			? '控制台'
			: currentPage === 'users'
				? '用户管理'
				: currentPage === 'templates'
					? '配置模板'
					: '管理员控制台');

	return (
		<nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-3">
						<AcmeLogo />
						<div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
						<p className="font-bold text-gray-900 text-lg tracking-tight hidden sm:block">{pageTitle}</p>
					</div>

					<div className="flex items-center gap-1 sm:gap-6 justify-center flex-1">
						<Link
							href={`/admin/dashboard?superToken=${superToken}`}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
								currentPage === 'dashboard'
									? 'text-blue-600 bg-blue-50'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
							)}
						>
							<LayoutDashboard className="w-4 h-4" />
							<span>控制台</span>
						</Link>
						<Link
							href={`/admin/users?superToken=${superToken}`}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
								currentPage === 'users'
									? 'text-blue-600 bg-blue-50'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
							)}
						>
							<Users className="w-4 h-4" />
							<span>用户管理</span>
						</Link>
						<Link
							href={`/admin/templates?superToken=${superToken}`}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
								currentPage === 'templates'
									? 'text-blue-600 bg-blue-50'
									: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
							)}
						>
							<FileText className="w-4 h-4" />
							<span>配置模板</span>
						</Link>
					</div>

					<div className="flex items-center justify-end">
						<Link
							href="/"
							className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
						>
							<Home className="w-4 h-4" />
							<span className="hidden sm:inline">返回首页</span>
						</Link>
					</div>
				</div>
			</div>
		</nav>
	);
}
