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
		<Navbar className="bg-background border-b border-divider">
			<NavbarBrand>
				<AcmeLogo />
				<h1 className="text-xl font-semibold">配置管理</h1>
			</NavbarBrand>

			<NavbarContent className="hidden md:flex gap-4" justify="center">
				<NavbarItem>
					<span className="text-sm text-default-500">
						用户ID: <span className="font-medium text-foreground">{uid}</span>
					</span>
				</NavbarItem>
				<NavbarItem>
					<Chip size="sm" color={connectionStatus === 'connected' ? 'success' : 'danger'} variant="dot">
						{connectionStatus === 'connected' ? '已连接' : '连接失败'}
					</Chip>
				</NavbarItem>
			</NavbarContent>

			<NavbarContent justify="end">
				<NavbarItem className="text-right">
					<div className="text-sm text-default-500">{lastSaved ? `最后保存: ${formatTime(lastSaved)}` : '未保存'}</div>
					<div className="text-xs text-default-400">数据源: {configSource}</div>
				</NavbarItem>
				<NavbarItem>
					<Button
						onClick={onSave}
						isDisabled={saving || validationErrors.length > 0}
						color={saveSuccess ? 'success' : 'primary'}
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
						{saving ? '保存中...' : saveSuccess ? '保存成功！' : '保存'}
					</Button>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
}
