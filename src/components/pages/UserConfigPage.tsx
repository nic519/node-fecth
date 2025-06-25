import type { FC } from 'hono/jsx'
import { ConfigResponse } from '@/types/user-config.types'
import { UserLayout } from '@/components/UserLayout'

interface UserConfigPageProps {
	userId: string
	configResponse: ConfigResponse
	token: string
}

export const UserConfigPage: FC<UserConfigPageProps> = ({ userId, configResponse, token }) => {
	const subscribeURL = `/${userId}?token=${token}`
	
	return (
		<UserLayout title={`配置管理 - ${userId}`} userId={userId}>
			<div x-data="configManager()" className="min-h-screen">
					<header className="bg-white border-b border-gray-200 shadow-sm">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="flex justify-between items-center h-16">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<h1 className="text-xl font-semibold text-gray-900">配置管理</h1>
									</div>
									<div className="hidden md:block ml-10">
										<div className="flex items-baseline space-x-4">
											<span className="text-sm text-gray-500">
												用户ID: <span className="font-medium text-gray-900" x-text="userId || '加载中...'"></span>
											</span>
											<div className="flex items-center">
												<div className="w-2 h-2 rounded-full mr-2" 
													x-bind:class="connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'"></div>
												<span className="text-sm"
													x-bind:class="connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'"
													x-text="connectionStatus === 'connected' ? '已连接' : '连接失败'"></span>
											</div>
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-4">
									<div className="text-right">
										<div className="text-sm text-gray-500" x-text="lastSaved ? '最后保存: ' + formatTime(lastSaved) : '未保存'"></div>
										<div className="text-xs text-gray-400" x-text="'数据源: ' + (configSource || '环境变量')"></div>
									</div>
									<button 
										x-on:click="saveConfig()" 
										x-bind:disabled="saving || validationErrors.length > 0"
										x-bind:class="saveSuccess ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'"
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
										<svg x-show="saving" className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										<svg x-show="!saving && !saveSuccess" className="h-4 w-4 mr-2 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
										</svg>
										<svg x-show="saveSuccess" className="h-4 w-4 mr-2 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
										<span x-text="saving ? '保存中...' : (saveSuccess ? '保存成功！' : '保存')"></span>
									</button>
								</div>
							</div>
						</div>
					</header>

					<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
						<div className="px-4 py-6 sm:px-0">
							<div className="bg-white shadow rounded-lg">
								<div className="px-4 py-5 sm:p-6">
									<div className="flex items-center justify-between mb-4">
										<div>
											<h3 className="text-lg leading-6 font-medium text-gray-900">YAML 配置</h3>
											<p className="mt-1 text-sm text-gray-500">编辑您的用户配置，保存后立即生效</p>
										</div>
									</div>

									<div x-show="validationErrors.length > 0" className="mb-4 rounded-md bg-red-50 p-4">
										<div className="flex">
											<div className="flex-shrink-0">
												<svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
												</svg>
											</div>
											<div className="ml-3">
												<h3 className="text-sm font-medium text-red-800">配置验证失败</h3>
												<div className="mt-2 text-sm text-red-700">
													<ul className="list-disc pl-5 space-y-1">
														<template x-for="error in validationErrors">
															<li x-text="error"></li>
														</template>
													</ul>
												</div>
											</div>
										</div>
									</div>

									<div x-show="validationErrors.length === 0 && configPreview" className="mb-4 rounded-md bg-green-50 p-4">
										<div className="flex">
											<div className="flex-shrink-0">
												<svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
												</svg>
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-green-800">配置格式正确</p>
											</div>
										</div>
									</div>

									<div className="mt-4">
										<textarea 
											x-model="configContent" 
											x-on:input="validateConfig($event.target.value)" 
											rows={20}
											className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono"
											placeholder="YAML 配置将在这里显示..." 
											spellCheck={false}>
										</textarea>
									</div>

									<div className="mt-6 flex items-center justify-between">
										<div className="flex items-center text-sm text-gray-500">
											<svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											支持 YAML 格式，保存前会自动验证
										</div>
										<div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
											<div className="flex items-center space-x-2">
												<svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
												</svg>
												<span className="text-sm font-medium text-gray-700">固定链接：</span>
											</div>
											<div className="flex-1 min-w-0">
												<a href={subscribeURL} target="_blank" 
													className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors duration-200 max-w-md truncate"
													x-text="subscribeURL">
												</a>
											</div>
											<button 
												x-on:click="copySubscribeURL()" 
												x-bind:class="copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'"
												className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105">
												<svg x-show="!copySuccess" className="h-4 w-4 mr-2 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
												</svg>
												<svg x-show="copySuccess" className="h-4 w-4 mr-2 transition-opacity duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
												<span x-text="copySuccess ? '已复制！' : '复制链接'"></span>
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</main>
				</div>

			<script 
				type="application/json" 
				id="server-data"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({ configResponse })
				}}>
			</script>
			<script src="/user-config.js"></script>
		</UserLayout>
	)
} 