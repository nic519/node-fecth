import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudArrowUpIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { AcmeLogo } from '../../../components/NavigationBar';
import { formatTime } from '../utils/configUtils';
import { cn } from '@/lib/utils';

interface HeaderProps {
	uid: string;
	connectionStatus: 'connected' | 'disconnected';
	lastSaved: Date | null;
	configSource: string;
	saving: boolean;
	saveSuccess: boolean;
	validationErrors: string[];
	onSave: () => void;
}

export function Header({ uid, connectionStatus, lastSaved, configSource, saving, saveSuccess, validationErrors, onSave }: HeaderProps) {
	return (
		<header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					<div className="flex items-center gap-2">
						<AcmeLogo />
						<h1 className="text-xl font-bold text-gray-900 tracking-tight">配置管理</h1>
					</div>

					<div className="hidden md:flex items-center gap-6 justify-center">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-500 font-medium">用户ID</span>
							<Badge variant="secondary" className="font-mono bg-gray-100 text-gray-700 hover:bg-gray-100">
								{uid}
							</Badge>
						</div>
						<div>
							<Badge
								variant={connectionStatus === 'connected' ? 'outline' : 'destructive'}
								className={cn(
									"capitalize pl-1 pr-2 py-0.5 border-transparent font-normal",
									connectionStatus === 'connected' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
								)}
							>
								<span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
								{connectionStatus === 'connected' ? '已连接' : '连接失败'}
							</Badge>
						</div>
					</div>

					<div className="flex items-center gap-4 justify-end">
						<div className="text-right hidden sm:block">
							<div className="text-xs text-gray-500 font-medium">
								{lastSaved ? `最后保存: ${formatTime(lastSaved)}` : '未保存'}
							</div>
							<div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
								数据源: {configSource}
							</div>
						</div>
						<div>
							<Button
								onClick={onSave}
								disabled={saving || validationErrors.length > 0}
								className={cn(
									"font-medium shadow-lg transition-all",
									saveSuccess ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
								)}
							>
								{saving ? (
									<ArrowPathIcon className="w-4 h-4 animate-spin mr-2" />
								) : saveSuccess ? (
									<CheckCircleIcon className="w-4 h-4 mr-2" />
								) : (
									<CloudArrowUpIcon className="w-4 h-4 mr-2" />
								)}
								{saving ? '保存中...' : saveSuccess ? '保存成功' : '保存配置'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
