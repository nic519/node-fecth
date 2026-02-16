import Link from 'next/link';
import { cn } from '@/lib/utils';

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
					<div className="flex items-center gap-2">
						<AcmeLogo />
						<p className="font-bold text-gray-900 text-lg tracking-tight">{pageTitle}</p>
					</div>
					
					<div className="hidden sm:flex items-center gap-6 justify-center flex-1">
						<Link 
                            href={`/admin/dashboard?superToken=${superToken}`} 
                            className={cn(
                                "text-sm font-medium transition-colors",
                                currentPage === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
							控制台
						</Link>
						<Link 
                            href={`/admin/users?superToken=${superToken}`} 
                            className={cn(
                                "text-sm font-medium transition-colors",
                                currentPage === 'users' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
							用户管理
						</Link>
						<Link 
                            href={`/admin/templates?superToken=${superToken}`} 
                            className={cn(
                                "text-sm font-medium transition-colors",
                                currentPage === 'templates' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                            )}
                        >
							配置模板
						</Link>
					</div>

					<div className="hidden lg:flex items-center justify-end">
						<Link href="/" className="text-sm text-gray-500 hover:text-gray-900">返回首页</Link>
					</div>
				</div>
			</div>
		</nav>
	);
}
