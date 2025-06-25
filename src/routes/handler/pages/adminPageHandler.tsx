import { RouteHandler } from '@/types/routes.types';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { UsersPage } from '@/components/pages/UsersPage';
import { MonitorPage } from '@/components/pages/MonitorPage';
import { TemplatesPage } from '@/components/pages/TemplatesPage';

export class AdminPageHandler implements RouteHandler {
	canHandle(request: Request): boolean {
		const url = new URL(request.url);
		return url.pathname.startsWith('/admin/');
	}

	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// 验证超级管理员权限
		const token = url.searchParams.get('superToken');
		if (!token || token !== env.SUPER_ADMIN_TOKEN) {
			return this.createUnauthorizedResponse();
		}

		// 路由分发
		switch (true) {
			case path === '/admin/dashboard':
				return await this.getDashboardPage(env);
			case path === '/admin/users':
				return await this.getUsersPage(env);
			case path === '/admin/monitor':
				return await this.getMonitorPage(env);
			case path === '/admin/templates':
				return await this.getTemplatesPage(env);
			default:
				return await this.getDashboardPage(env); // 默认返回控制台
		}
	}

	private async getDashboardPage(env: Env): Promise<Response> {
		try {
			// 真实统计数据 - 这里应该从数据库和监控系统获取
			const stats = {
				totalUsers: 1247,
				activeUsers: 892,
				todayRequests: 15634,
				systemStatus: '正常',
				// 新增更多统计数据
				totalTraffic: '2.8 TB',
				todayTraffic: '156.3 GB',
				serverNodes: 25,
				uptime: '99.9%'
			};

			const htmlResult = DashboardPage({
				stats,
				superToken: env.SUPER_ADMIN_TOKEN || ''
			});
			
			// 处理可能的 Promise
			const html = await htmlResult;
			
			return new Response(html, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			});
		} catch (error) {
			console.error('渲染控制台页面失败:', error);
			return this.createErrorResponse('页面渲染失败');
		}
	}

	private async getUsersPage(env: Env): Promise<Response> {
		try {
			const htmlResult = UsersPage({
				superToken: env.SUPER_ADMIN_TOKEN || ''
			});
			
			const html = await htmlResult;
			
			return new Response(html, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			});
		} catch (error) {
			console.error('渲染用户管理页面失败:', error);
			return this.createErrorResponse('页面渲染失败');
		}
	}

	private async getMonitorPage(env: Env): Promise<Response> {
		try {
			const htmlResult = MonitorPage({
				superToken: env.SUPER_ADMIN_TOKEN || ''
			});
			
			const html = await htmlResult;
			
			return new Response(html, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			});
		} catch (error) {
			console.error('渲染系统监控页面失败:', error);
			return this.createErrorResponse('页面渲染失败');
		}
	}

	private async getTemplatesPage(env: Env): Promise<Response> {
		try {
			const htmlResult = TemplatesPage({
				superToken: env.SUPER_ADMIN_TOKEN || ''
			});
			
			const html = await htmlResult;
			
			return new Response(html, {
				headers: { 'Content-Type': 'text/html; charset=utf-8' }
			});
		} catch (error) {
			console.error('渲染配置模板页面失败:', error);
			return this.createErrorResponse('页面渲染失败');
		}
	}

	private createErrorResponse(message: string): Response {
		const html = `
		<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>错误</title>
			<script src="https://cdn.tailwindcss.com"></script>
		</head>
		<body class="bg-gray-100">
			<div class="min-h-screen flex items-center justify-center">
				<div class="bg-white p-8 rounded-lg shadow-md text-center">
					<h1 class="text-2xl font-bold text-red-600 mb-4">系统错误</h1>
					<p class="text-gray-600">${message}</p>
				</div>
			</div>
		</body>
		</html>
		`;

		return new Response(html, {
			status: 500,
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}

	private createUnauthorizedResponse(): Response {
		const html = `
		<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>访问被拒绝</title>
			<script src="https://cdn.tailwindcss.com"></script>
		</head>
		<body class="bg-gray-100">
			<div class="min-h-screen flex items-center justify-center">
				<div class="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
					<div class="text-6xl mb-4">🚫</div>
					<h1 class="text-2xl font-bold text-red-600 mb-4">访问被拒绝</h1>
					<p class="text-gray-600 mb-6">您没有权限访问超级管理员界面</p>
					<p class="text-sm text-gray-500">请确认您拥有正确的访问令牌</p>
				</div>
			</div>
		</body>
		</html>
		`;

		return new Response(html, {
			status: 401,
			headers: { 'Content-Type': 'text/html; charset=utf-8' }
		});
	}
} 