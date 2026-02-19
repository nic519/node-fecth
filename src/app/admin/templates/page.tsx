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
		<div className="min-h-screen bg-background">
			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="templates" />

			<main className="max-w-[1600px] mx-auto py-6 px-4 sm:px-6 lg:px-8 h-[calc(100vh-64px)]">
				{/* 错误信息 */}
				{error && (
					<div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
						<div className="text-destructive font-medium">{error}</div>
					</div>
				)}

				{/* 加载状态 */}
				{loading && !templates.length ? (
					<div className="flex items-center justify-center h-full">
						<Loading message="加载中..." />
					</div>
				) : (
					/* 主要内容区域 - 左右布局 */
					<div className="grid grid-cols-12 gap-6 h-full">
						{/* 左侧 - 模板列表 */}
						<div className="col-span-12 lg:col-span-3 flex flex-col h-full">
							<AdminSidePanel
								title="模板列表"
								icon={FileText}
								className="h-full flex flex-col border-none shadow-none bg-transparent p-0"
								action={
									<Button
										onClick={handleCreateTemplate}
										size="sm"
										className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-none rounded-md"
									>
										<PlusIcon className="w-3.5 h-3.5 mr-1.5" />
										新建
									</Button>
								}
							>
								<div className="flex-1 overflow-y-auto pr-2 -mr-2">
									<TemplateList
										templates={templates}
										onSelectTemplate={handleSelectTemplate}
										onDeleteTemplate={handleDeleteTemplate}
										onStartEdit={handleStartEdit}
									/>
								</div>
							</AdminSidePanel>
						</div>

						{/* 右侧 - 配置编辑器 */}
						<div className="col-span-12 lg:col-span-9 h-full overflow-hidden flex flex-col bg-card rounded-xl border shadow-sm">
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
