import { AcmeLogo } from '../../../components/NavigationBar';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface HeaderProps {
	// validationErrors: string[]; // Might not need this anymore if not used
}

export function Header({ }: HeaderProps) {
	return (
		<header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-border/40 shadow-sm supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3">
							<div className="bg-gradient-to-br from-primary/20 to-violet-500/20 p-1.5 rounded-lg border border-primary/10">
								<AcmeLogo className="w-6 h-6 text-primary" />
							</div>
							<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-zinc-200 dark:to-zinc-400 tracking-tight">配置管理</h1>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ModeToggle />
					</div>
				</div>
			</div>
		</header>
	);
}
