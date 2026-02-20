import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, FileText, Home } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';

export interface NavigationBarProps {
	superToken: string;
	currentPage?: 'dashboard' | 'users' | 'templates';
	title?: string;
}

export const AcmeLogo = ({ className }: { className?: string }) => {
	return (
		<svg fill="none" height="36" viewBox="0 0 32 32" width="36" className={cn("text-primary dark:text-violet-400", className)}>
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
		<nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-border/40 shadow-sm supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-3">
						<AcmeLogo />
						<div className="h-6 w-px bg-border/60 mx-1 hidden sm:block"></div>
						<p className="font-bold text-foreground text-lg tracking-tight hidden sm:block">{pageTitle}</p>
					</div>

					<div className="flex items-center gap-1 sm:gap-6 justify-center flex-1">
						<Link
							href={`/admin/dashboard?superToken=${superToken}`}
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
								currentPage === 'dashboard'
									? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold shadow-sm ring-1 ring-violet-500/20'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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
									? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold shadow-sm ring-1 ring-violet-500/20'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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
									? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 text-violet-600 dark:text-violet-400 font-bold shadow-sm ring-1 ring-violet-500/20'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
							)}
						>
							<FileText className="w-4 h-4" />
							<span>配置模板</span>
						</Link>
					</div>

					<div className="flex items-center justify-end gap-2">
						<Link
							href="/"
							className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
						>
							<Home className="w-4 h-4" />
							<span className="hidden sm:inline">返回首页</span>
						</Link>
						<ModeToggle />
					</div>
				</div>
			</div>
		</nav>
	);
}
