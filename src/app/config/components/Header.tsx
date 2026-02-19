import { Settings, Shield, RefreshCw, Key, Eye } from 'lucide-react';
import { AcmeLogo } from '../../../components/NavigationBar';
import { ConfigTab } from './ConfigForm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/ui/mode-toggle';

interface HeaderProps {
	validationErrors: string[];
	activeTab: ConfigTab;
	onTabChange: (tab: ConfigTab) => void;
}

export function Header({ validationErrors, activeTab, onTabChange }: HeaderProps) {
	const navItems = [
		{ id: 'basic', label: '基础配置', icon: Settings },
		{ id: 'rules', label: '规则模板', icon: Shield },
		{ id: 'dynamic', label: '订阅加载', icon: RefreshCw },
		{ id: 'token', label: '访问令牌', icon: Key },
		{ id: 'preview', label: '预览结果', icon: Eye },
	] as const;

	return (
		<header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-border/40 shadow-sm supports-[backdrop-filter]:bg-white/60">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3">
							<div className="bg-gradient-to-br from-primary/20 to-violet-500/20 p-1.5 rounded-lg border border-primary/10">
								<AcmeLogo className="w-6 h-6 text-primary" />
							</div>
							<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400 tracking-tight">配置管理</h1>
						</div>
					</div>

					<nav className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border/50">
						{navItems.map((item) => (
							<Button
								key={item.id}
								variant="ghost"
								size="sm"
								onClick={() => onTabChange(item.id)}
								className={cn(
									"gap-2 transition-all duration-300 ease-in-out rounded-lg",
									activeTab === item.id
										? "bg-white dark:bg-slate-800 text-primary font-semibold shadow-sm ring-1 ring-black/5 dark:ring-white/10"
										: "text-muted-foreground hover:text-foreground hover:bg-transparent"
								)}
							>
								<item.icon className={cn("w-4 h-4 transition-colors", activeTab === item.id ? "text-primary" : "text-muted-foreground")} />
								{item.label}
							</Button>
						))}
					</nav>

					<div className="flex items-center gap-2">
						<ModeToggle />
					</div>
				</div>
			</div>
		</header>
	);
}
