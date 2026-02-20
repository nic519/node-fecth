'use client';

import Loading from '@/components/Loading';
import { NavigationBar } from '@/components/NavigationBar';
import { AdminSidePanel } from '@/components/admin/AdminSidePanel';
import { AdminTwoColumnLayout } from '@/components/admin/AdminTwoColumnLayout';
import { FileText, Plus } from 'lucide-react';
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
					<div className="flex items-center justify-center h-full">
						<Loading message="加载中..." />
					</div>
				) : (
					<AdminTwoColumnLayout
						sidebar={
							<AdminSidePanel
								title="模板列表"
								icon={FileText}
								className="h-fit"
								action={
									<Button
										onClick={handleCreateTemplate}
										size="sm"
										className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-none rounded-md"
									>
										<Plus className="w-3.5 h-3.5 mr-1.5" />
										新建
									</Button>
								}
							>
								<div className="max-h-[70vh] overflow-y-auto pr-2 -mr-2">
									<TemplateList
										templates={templates}
										onSelectTemplate={handleSelectTemplate}
									/>
								</div>
							</AdminSidePanel>
						}
						content={
							<div className="h-[calc(100vh-8rem)] overflow-hidden flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-border/60 shadow-sm">
								<TemplateEditor
									selectedTemplate={selectedTemplate}
									isEditing={isEditing}
									validationErrors={validationErrors}
									currentConfigContent={currentConfigContent}
									onStartEdit={handleStartEdit}
									onDeleteTemplate={() => selectedTemplate && handleDeleteTemplate(String(selectedTemplate.id))}
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
						}
					/>
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
