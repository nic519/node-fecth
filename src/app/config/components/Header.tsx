import Loading from '@/components/Loading';
import { Button, Chip, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';
import { AcmeLogo } from '../../../components/NavigationBar';
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
		<Navbar 
            className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm"
            maxWidth="xl"
            position="sticky"
        >
			<NavbarBrand className="gap-2">
				<AcmeLogo />
				<h1 className="text-xl font-bold text-gray-900 tracking-tight">配置管理</h1>
			</NavbarBrand>

			<NavbarContent className="hidden md:flex gap-6" justify="center">
				<NavbarItem className="flex items-center gap-2">
					<span className="text-sm text-gray-500 font-medium">用户ID</span>
                    <Chip size="sm" variant="flat" color="default" className="font-mono bg-gray-100 text-gray-700">
                        {uid}
                    </Chip>
				</NavbarItem>
				<NavbarItem>
					<Chip 
                        size="sm" 
                        color={connectionStatus === 'connected' ? 'success' : 'danger'} 
                        variant="flat"
                        className="capitalize"
                        startContent={
                            <span className={`w-1.5 h-1.5 rounded-full ml-1 ${connectionStatus === 'connected' ? 'bg-success-500' : 'bg-danger-500'}`}></span>
                        }
                    >
						{connectionStatus === 'connected' ? '已连接' : '连接失败'}
					</Chip>
				</NavbarItem>
			</NavbarContent>

			<NavbarContent justify="end">
				<NavbarItem className="text-right hidden sm:block">
					<div className="text-xs text-gray-500 font-medium">
                        {lastSaved ? `最后保存: ${formatTime(lastSaved)}` : '未保存'}
                    </div>
					<div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                        数据源: {configSource}
                    </div>
				</NavbarItem>
				<NavbarItem>
					<Button
						onPress={onSave}
						isDisabled={saving || validationErrors.length > 0}
						color={saveSuccess ? 'success' : 'primary'}
                        variant="solid"
                        className={`font-medium ${saveSuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white shadow-blue-200 shadow-lg'}`}
						startContent={
							saving ? (
								<Loading size="sm" />
							) : !saving && !saveSuccess ? (
								<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
									/>
								</svg>
							) : (
								<svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
								</svg>
							)
						}
					>
						{saving ? '保存中...' : saveSuccess ? '保存成功' : '保存配置'}
					</Button>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
}
