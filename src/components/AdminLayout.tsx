import type { FC } from 'hono/jsx'
import { Navigation } from './Navigation'

interface AdminLayoutProps {
	title: string
	currentPage: string
	children: any
	superToken: string
}

export const AdminLayout: FC<AdminLayoutProps> = ({ title, currentPage, children, superToken }) => {
	return (
		<html lang="zh-CN">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>{title} - 超级管理员后台</title>
				<script src="https://cdn.tailwindcss.com"></script>
				<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
			</head>
			<body class="bg-gray-100">
				<div class="min-h-screen">
					<Navigation currentPage={currentPage} superToken={superToken} />
					<main class="ml-64 p-8">
						{children}
					</main>
				</div>
			</body>
		</html>
	)
} 