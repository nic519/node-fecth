'use client';

import { NavigationBar } from '@/components/NavigationBar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LogViewer } from './components/LogViewer';

function DashboardContent() {
	// 设置页面标题
	usePageTitle('日志管理');

	const searchParams = useSearchParams();
	const superToken = searchParams.get('superToken') || '';

	if (!superToken) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="bg-white p-8 rounded-lg shadow-md">
					<h1 className="text-2xl font-bold text-red-600 mb-4">访问拒绝</h1>
					<p className="text-gray-600">缺少管理员令牌</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
			{/* Decorative background gradient */}
			<div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20 pointer-events-none" />

			{/* 顶部导航 */}
			<NavigationBar superToken={superToken} currentPage="dashboard" />

			{/* 主内容 */}
			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="space-y-6">
					<LogViewer superToken={superToken} />
				</div>
			</main>
		</div>
	);
}

export default function AdminDashboard() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
			<DashboardContent />
		</Suspense>
	);
}
