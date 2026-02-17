/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { NavigationBar } from '@/components/NavigationBar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LogViewer } from './components/LogViewer';

function DashboardContent() {
	// 设置页面标题
	usePageTitle('控制台');

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
		<div className="min-h-screen bg-gray-100">
			{/* 顶部导航 */}
			<NavigationBar superToken={superToken} currentPage="dashboard" />

			{/* 主内容 */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0 space-y-6">
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
