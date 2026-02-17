/* eslint-disable @typescript-eslint/no-unused-vars */
import { CheckCircle } from 'lucide-react';
import { AcmeLogo } from '../../../components/NavigationBar';

interface HeaderProps {
	validationErrors: string[];
}

export function Header({ validationErrors }: HeaderProps) {
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
				</div>
			</div>
		</header>
	);
}
