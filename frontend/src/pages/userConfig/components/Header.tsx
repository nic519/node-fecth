import Loading from '@/components/Loading';
import { formatTime } from '../utils/configUtils';

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
		<header className="bg-white border-b border-gray-200 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<h1 className="text-xl font-semibold text-gray-900">配置管理</h1>
						</div>
						<div className="hidden md:block ml-10">
							<div className="flex items-baseline space-x-4">
								<span className="text-sm text-gray-500">
									用户ID: <span className="font-medium text-gray-900">{uid}</span>
								</span>
								<div className="flex items-center">
									<div className={`w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></div>
									<span className={`text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
										{connectionStatus === 'connected' ? '已连接' : '连接失败'}
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<div className="text-right">
							<div className="text-sm text-gray-500">{lastSaved ? `最后保存: ${formatTime(lastSaved)}` : '未保存'}</div>
							<div className="text-xs text-gray-400">数据源: {configSource}</div>
						</div>
						<button
							onClick={onSave}
							disabled={saving || validationErrors.length > 0}
							className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
								saveSuccess
									? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
									: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
							}`}
						>
							{saving && (
								<div className="mr-2">
									<Loading size="sm" className="text-white" />
								</div>
							)}
							{!saving && !saveSuccess && (
								<svg
									className="h-4 w-4 mr-2 transition-opacity duration-200"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
									/>
								</svg>
							)}
							{saveSuccess && (
								<svg
									className="h-4 w-4 mr-2 transition-opacity duration-200"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							)}
							<span>{saving ? '保存中...' : saveSuccess ? '保存成功！' : '保存'}</span>
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}
