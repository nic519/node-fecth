import { Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/react';

export interface NavigationBarProps {
	superToken: string;
	currentPage?: 'dashboard' | 'users' | 'templates';
	title?: string;
}

export const AcmeLogo = () => {
	return (
		<svg fill="none" height="36" viewBox="0 0 32 32" width="36">
			<path
				clipRule="evenodd"
				d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	);
};

/**
 * 管理员页面通用导航栏组件
 */
export function NavigationBar({ superToken, currentPage, title }: NavigationBarProps) {
	// 根据当前页面设置标题
	const pageTitle =
		title ||
		(currentPage === 'dashboard'
			? '控制台'
			: currentPage === 'users'
				? '用户管理'
				: currentPage === 'templates'
					? '配置模板'
					: '管理员控制台');

	return (
		<Navbar>
			<NavbarBrand>
				<AcmeLogo />
				<p className="font-bold text-inherit">{pageTitle}</p>
			</NavbarBrand>
			<NavbarContent className="hidden sm:flex gap-4" justify="center">
				<NavbarItem isActive={currentPage === 'dashboard'}>
					<Link href={`/admin/dashboard?superToken=${superToken}`} aria-current={currentPage === 'dashboard' ? 'page' : undefined}>
						控制台
					</Link>
				</NavbarItem>
				<NavbarItem isActive={currentPage === 'users'}>
					<Link href={`/admin/users?superToken=${superToken}`} aria-current={currentPage === 'users' ? 'page' : undefined}>
						用户管理
					</Link>
				</NavbarItem>
				<NavbarItem isActive={currentPage === 'templates'}>
					<Link href={`/admin/templates?superToken=${superToken}`} aria-current={currentPage === 'templates' ? 'page' : undefined}>
						配置模板
					</Link>
				</NavbarItem>
			</NavbarContent>
			<NavbarContent justify="end">
				<NavbarItem className="hidden lg:flex">
					<Link href="/">返回首页</Link>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
}
