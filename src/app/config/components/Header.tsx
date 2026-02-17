/* eslint-disable @typescript-eslint/no-unused-vars */
import { CheckCircle, Settings, Shield, RefreshCw, Key, Eye } from 'lucide-react';
import { AcmeLogo } from '../../../components/NavigationBar';
import { ConfigTab } from './ConfigForm';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
		<header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<AcmeLogo />
							<h1 className="text-xl font-bold text-gray-900 tracking-tight">配置管理</h1>
						</div>
						{validationErrors.length === 0 && (
							<div className="hidden md:flex items-center text-xs font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
								<CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
								配置格式正确
							</div>
						)}
					</div>

					<nav className="hidden md:flex items-center gap-1">
						{navItems.map((item) => (
							<Button
								key={item.id}
								variant={activeTab === item.id ? 'secondary' : 'ghost'}
								size="sm"
								onClick={() => onTabChange(item.id)}
								className={cn(
									"gap-2",
									activeTab === item.id && "bg-gray-100 text-gray-900 font-medium"
								)}
							>
								<item.icon className="w-4 h-4" />
								{item.label}
							</Button>
						))}
					</nav>
				</div>
			</div>
		</header>
	);
}
