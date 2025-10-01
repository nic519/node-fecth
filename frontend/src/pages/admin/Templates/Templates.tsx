import Loading from '@/components/Loading';
import { NavigationBar } from '@/components/NavigationBar';
import { TemplateEditor } from '@/pages/admin/Templates/components/TemplateEditor';
import { TemplateList } from '@/pages/admin/Templates/components/TemplateList';
import { TemplateModals } from '@/pages/admin/Templates/components/TemplateModals';
import { useTemplateManagement } from '@/pages/admin/Templates/hooks/useTemplateManagement';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';

export function AdminTemplates() {
	console.log('AdminTemplates component rendered');

	// 获取超级管理员令牌
	const superToken = new URLSearchParams(window.location.search).get('superToken') || '';
	console.log('superToken:', superToken);

	// 使用模板管理Hook
	const templateManagementResult = useTemplateManagement({ superToken });
	console.log('Template management hook result:', templateManagementResult);

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
	} = templateManagementResult;

	console.log('Destructured values:', {
		templates,
		selectedTemplate,
		loading,
		error,
		isEditing,
	});

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
					{loading ? (
						<div className="flex items-center justify-center" style={{ height: 'calc(100vh - 180px)', minHeight: '700px' }}>
							<Loading message="加载中..." />
						</div>
					) : (
						/* 主要内容区域 - 左右布局 */
						<div className="flex gap-6" style={{ height: 'calc(100vh - 180px)', minHeight: '700px' }}>
							{/* 左侧 - 模板列表 */}
							<div className="w-96 flex flex-col">
								<TemplateList
									templates={templates}
									onSelectTemplate={handleSelectTemplate}
									onDeleteTemplate={handleDeleteTemplate}
									headerAction={
										<Button
											onPress={handleCreateTemplate}
											size="sm"
											variant="solid"
											className="bg-blue-600 text-white hover:bg-blue-700"
											startContent={<PlusIcon className="w-4 h-4" />}
										>
											新建模板
										</Button>
									}
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
