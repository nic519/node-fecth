'use client';

import Loading from '@/components/Loading';
import { NavigationBar } from '@/components/NavigationBar';
import { AdminSidePanel } from '@/components/admin/AdminSidePanel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { FileText } from 'lucide-react';
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
		<div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
			{/* Decorative background gradient */}
			<div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20 pointer-events-none" />

			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="templates" />

			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				{/* 错误信息 */}
				{error && (
					<div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
						<div className="text-destructive font-medium">{error}</div>
					</div>
				)}

				{/* 加载状态 */}
				{loading && !templates.length ? (
					<div className="flex items-center justify-center" style={{ height: 'calc(100vh - 180px)', minHeight: '700px' }}>
						<Loading message="加载中..." />
					</div>
				) : (
					/* 主要内容区域 - 左右布局 */
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start" style={{ minHeight: '700px' }}>
						{/* 左侧 - 模板列表 */}
						<AdminSidePanel
							title="模板列表"
							icon={FileText}
							className="lg:col-span-1 h-fit"
							action={
								<Button
									onClick={handleCreateTemplate}
									size="sm"
									variant="default"
									className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md transition-all duration-300"
								>
									<PlusIcon className="w-4 h-4 mr-2" />
									新建模板
								</Button>
							}
						>
							<TemplateList
								templates={templates}
								onSelectTemplate={handleSelectTemplate}
								onDeleteTemplate={handleDeleteTemplate}
								onStartEdit={handleStartEdit}
							/>
						</AdminSidePanel>

						{/* 右侧 - 配置编辑器 */}
						<div className="lg:col-span-3 flex flex-col">
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
