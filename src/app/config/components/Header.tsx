import { Button } from '@/components/ui/button';
import { CheckCircle, CloudUpload, CheckCircle2, Loader2 } from 'lucide-react';
import { AcmeLogo } from '../../../components/NavigationBar';
import { cn } from '@/lib/utils';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';

interface HeaderProps {
	lastSaved: Date | null;
	saving: boolean;
	saveSuccess: boolean;
	validationErrors: string[];
	onSave: () => void;
	uid: string;
	token: string;
}

export function Header({ lastSaved, saving, saveSuccess, validationErrors, onSave, uid, token }: HeaderProps) {
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

					<div className="flex items-center gap-4 justify-end">
						<div className="hidden md:block">
							<SubscribeUrlPanel uid={uid} token={token} />
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
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
								) : saveSuccess ? (
									<CheckCircle2 className="w-4 h-4 mr-2" />
								) : (
									<CloudUpload className="w-4 h-4 mr-2" />
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
