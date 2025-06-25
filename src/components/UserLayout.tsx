import type { FC } from 'hono/jsx'

interface UserLayoutProps {
	title: string
	userId: string
	children: any
}

export const UserLayout: FC<UserLayoutProps> = ({ title, userId, children }) => {
	return (
		<html lang="zh-CN">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>{title}</title>
				<script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
				<script src="https://cdn.tailwindcss.com"></script>
				<script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
				<link rel="stylesheet" href="/styles.css" />
			</head>
			<body className="min-h-screen bg-gray-50">
				{children}
			</body>
		</html>
	)
} 