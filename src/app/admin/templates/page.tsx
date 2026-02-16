'use client';

import Loading from '@/components/Loading';
import { NavigationBar } from '@/components/NavigationBar';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplateList } from './components/TemplateList';
import { TemplateModals } from './components/TemplateModals';
import { useTemplateManagement } from './hooks/useTemplateManagement';

function AdminTemplatesContent() {
	// 获取超级管理员令牌
	const searchParams = useSearchParams();
	const superToken = searchParams.get('superToken') || '';

	// 使用模板管理Hook
	const {
		// 数据状态
		templates,
		selectedTemplate,
		currentConfigContent,
		loading,
		saving,
		error,
		isEditing,
		validationErrors,

		// 模态框状态
		isDeleteModalOpen,
		isErrorModalOpen,

		// 操作函数
		handleSelectTemplate,
		handleStartEdit,
		handleCreateTemplate,
		handleDeleteTemplate,
		confirmDeleteTemplate,
		handleUpdateTemplate,
		handleUpdateConfigContent,
		handleSave,
		handleReset,
		handleDownloadTemplate,
		handleCopyConfigContent,
		handleCopyTemplateUrl,

		// 模态框控制
		closeDeleteModal,
		closeErrorModal,

		// 设置验证错误
		setValidationErrors,
	} = useTemplateManagement({ superToken });

	return (
		<div className="min-h-screen bg-gray-100">
			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="templates" />

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					{/* 错误信息 */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{/* 加载状态 */}
					{loading && !templates.length ? (
						<div className="flex items-center justify-center" style={{ height: 'calc(100vh - 180px)', minHeight: '700px' }}>
							<Loading message="加载中..." />
						</div>
					) : (
						/* 主要内容区域 - 左右布局 */
						<div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: '700px' }}>
							{/* 左侧 - 模板列表 */}
							<div className="w-full lg:w-96 flex flex-col">
								<div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
									<h2 className="text-lg font-semibold text-gray-900">模板列表</h2>
									<Button
										onClick={handleCreateTemplate}
										size="sm"
										variant="default"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
									>
                                        <PlusIcon className="w-4 h-4 mr-2" />
										新建模板
									</Button>
								</div>
								<TemplateList
									templates={templates}
									onSelectTemplate={handleSelectTemplate}
									onDeleteTemplate={handleDeleteTemplate}
								/>
							</div>

							{/* 右侧 - 配置编辑器 */}
							<div className="flex-1 flex flex-col">
								<TemplateEditor
									selectedTemplate={selectedTemplate}
									isEditing={isEditing}
									validationErrors={validationErrors}
									currentConfigContent={currentConfigContent}
									onStartEdit={handleStartEdit}
									onUpdateTemplate={handleUpdateTemplate}
									onUpdateConfigContent={handleUpdateConfigContent}
									onValidate={setValidationErrors}
									onDownloadTemplate={handleDownloadTemplate}
									onReset={handleReset}
									onSave={handleSave}
									onCopyConfigContent={handleCopyConfigContent}
									onCopyTemplateUrl={handleCopyTemplateUrl}
									loading={loading}
									saving={saving}
								/>
							</div>
						</div>
					)}
				</div>
			</main>

			{/* 模态框 */}
			<TemplateModals
				isDeleteModalOpen={isDeleteModalOpen}
				closeDeleteModal={closeDeleteModal}
				confirmDeleteTemplate={confirmDeleteTemplate}
				isErrorModalOpen={isErrorModalOpen}
				closeErrorModal={closeErrorModal}
				loading={loading}
			/>
		</div>
	);
}

export default function AdminTemplates() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
			<AdminTemplatesContent />
		</Suspense>
	);
}
