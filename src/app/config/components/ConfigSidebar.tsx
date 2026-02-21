'use client';

import { AcmeLogo } from '@/components/NavigationBar';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ConfigTab } from './ConfigForm';
import { User, Settings, Shield, RefreshCw, Key, Eye, Clock, Loader2, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';

interface ConfigSidebarProps {
	uid: string;
	token: string;
	activeTab: ConfigTab;
	onTabChange: (tab: ConfigTab) => void;
	validationErrors: string[];
	lastSaved?: Date | null;
	onSave: () => void;
	saving: boolean;
	saveSuccess: boolean;
	isOpen?: boolean;
	onClose?: () => void;
}

export function ConfigSidebar({
	uid,
	token,
	activeTab,
	onTabChange,
	validationErrors,
	lastSaved,
	onSave,
	saving,
	saveSuccess,
	isOpen,
	onClose,
}: ConfigSidebarProps) {

	const navItems = [
		{ id: 'basic', label: '基础配置', icon: Settings },
		{ id: 'rules', label: '规则模板', icon: Shield },
		{ id: 'dynamic', label: '订阅加载', icon: RefreshCw },
		{ id: 'token', label: '访问令牌', icon: Key },
		{ id: 'preview', label: '预览结果', icon: Eye },
	] as const;

	const hasErrors = validationErrors.length > 0;

	return (
		<>
			{/* Mobile Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
					onClick={onClose}
				/>
			)}

			<aside className={cn(
				"fixed inset-y-0 left-0 z-50 w-72 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-r border-border/40 flex flex-col transition-transform duration-300 shadow-2xl shadow-black/5",
				isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
			)}>
				{/* Header Section */}
				<div className="h-20 flex items-center justify-between px-6 bg-gradient-to-b from-white/50 to-transparent dark:from-white/5">
					<div className="flex items-center gap-3">
						<div className="p-0">
							<AcmeLogo className="w-10 h-10 text-primary" />
						</div>
						<div className="flex flex-col">
							<span className="font-bold text-lg text-foreground tracking-tight leading-none">
								配置管理
							</span>
							<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">
								Configuration
							</span>
						</div>
					</div>
					<ModeToggle className="h-8 w-8 border-border/50 shadow-sm" />
				</div>

				{/* User Info Section - Minimalist */}
				<div className="px-4 py-2 space-y-2">
					<div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors cursor-default group">
						<div className="h-9 w-9 rounded-full bg-gradient-to-tr from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
							<User className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
						</div>
						<div className="flex flex-col min-w-0">
							<span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">当前用户</span>
							<span className="font-mono font-bold text-xs truncate text-foreground/80" title={uid}>
								{uid}
							</span>
						</div>
					</div>

					{/* Subscribe URL Panel acting as separator */}
					<div className="px-2 pt-1">
						<div className="text-[10px] font-medium text-muted-foreground/50 px-1 mb-1 uppercase tracking-wider">
							订阅链接
						</div>
						<SubscribeUrlPanel uid={uid} token={token} />
					</div>
				</div>

				{/* Navigation Menu */}
				<div className="flex-1 overflow-y-auto py-4 px-4 space-y-1.5 custom-scrollbar">
					{navItems.map((item) => {
						const isActive = activeTab === item.id;
						return (
							<button
								key={item.id}
								onClick={() => onTabChange(item.id)}
								className={cn(
									"w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
									isActive
										? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
										: "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1"
								)}
							>
								{isActive && (
									<div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
								)}
								<item.icon className={cn(
									"w-4 h-4 transition-transform duration-300 group-hover:scale-110",
									isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
								)} />
								<span className="flex-1 text-left">{item.label}</span>

								{isActive && (
									<div className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-sm shadow-black/20" />
								)}
							</button>
						);
					})}
				</div>

				{/* Bottom Action Deck */}
				<div className="p-4 bg-gradient-to-t from-background via-background/95 to-transparent space-y-3">

					{/* Primary Action Button */}
					<div className="relative">
						<Button
							onClick={onSave}
							disabled={saving || hasErrors}
							className={cn(
								"w-full h-12 rounded-xl font-bold text-sm shadow-xl transition-all duration-300 relative overflow-hidden group",
								hasErrors
									? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 shadow-none cursor-not-allowed"
									: saveSuccess
										? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/25"
										: "bg-gradient-to-r from-primary via-violet-600 to-indigo-600 hover:from-primary/90 hover:via-violet-700 hover:to-indigo-700 text-white shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5"
							)}
						>
							{/* Animated Background Shine */}
							{!hasErrors && !saveSuccess && (
								<div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
							)}

							<div className="relative z-10 flex items-center justify-center gap-2.5">
								{saving ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : saveSuccess ? (
									<CheckCircle2 className="w-4 h-4" />
								) : hasErrors ? (
									<AlertCircle className="w-4 h-4" />
								) : (
									<Save className="w-4 h-4" />
								)}

								<span>
									{saving ? '正在保存...'
										: saveSuccess ? '保存成功'
											: hasErrors ? '配置有误'
												: '保存配置'}
								</span>
							</div>
						</Button>

						{/* Last Saved Status - Subtly placed below button */}
						{lastSaved && (
							<div className="absolute -top-8 right-0 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-background/50 backdrop-blur-sm px-2 py-1 rounded-full border border-border/50 shadow-sm">
								<Clock className="h-3 w-3" />
								<span>上次保存: {lastSaved.toLocaleString('zh-CN', { hour: 'numeric', minute: 'numeric' })}</span>
							</div>
						)}
					</div>
				</div>
			</aside>
		</>
	);
}
