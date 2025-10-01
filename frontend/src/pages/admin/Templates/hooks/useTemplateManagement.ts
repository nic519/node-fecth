import { usePageTitle } from '@/hooks/usePageTitle';
import { useToastContext } from '@/providers/toast-provider';
import type { ConfigTemplate } from '@/types/user-config';
import { useDisclosure } from '@heroui/react';
import { useEffect, useState } from 'react';
import type { TemplateItem } from '../components/TemplateList';

export interface UseTemplateManagementProps {
	superToken: string;
}

export interface UseTemplateManagementReturn {
	// 数据状态
	templates: TemplateItem[];
	selectedTemplate: TemplateItem | null;
	currentConfigContent: string;
	loading: boolean;
	saving: boolean;
	error: string | null;
	isEditing: boolean;
	validationErrors: string[];

	// 模态框状态
	isDeleteModalOpen: boolean;
	isErrorModalOpen: boolean;
	templateToDelete: string | null;
	modalMessage: string;

	// 操作函数
	loadTemplates: () => void;
	handleSelectTemplate: (templateId: string) => void;
	handleStartEdit: () => void;
	handleCreateTemplate: () => void;
	handleDeleteTemplate: (templateId: string, e: any) => void;
	confirmDeleteTemplate: () => void;
	handleUpdateTemplate: (field: keyof TemplateItem, value: any) => void;
	handleUpdateConfigContent: (content: string) => void;
	handleSave: () => void;
	handleReset: () => void;
	handleDownloadTemplate: () => void;
	handleCopyConfigContent: () => void;

	// 模态框控制
	closeDeleteModal: () => void;
	closeErrorModal: () => void;
	openDeleteModal: () => void;
	setValidationErrors: (errors: string[]) => void;
}

/**
 * 模板管理Hook - 处理模板数据的CRUD操作
 */
export const useTemplateManagement = ({ superToken }: UseTemplateManagementProps): UseTemplateManagementReturn => {
	console.log('useTemplateManagement hook called with superToken:', superToken);

	// 设置页面标题
	usePageTitle('配置模板');

	// Toast hook
	const { showToast } = useToastContext();

	// 数据状态
	const [templates, setTemplates] = useState<TemplateItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	// 模态框状态
	const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onOpenChange: closeDeleteModal } = useDisclosure();
	const { isOpen: isErrorModalOpen, onOpen: openErrorModal, onOpenChange: closeErrorModal } = useDisclosure();
	const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
	const [modalMessage, setModalMessage] = useState<string>('');

	// 计算属性
	const selectedTemplate = templates.find((t) => t.isSelected) || null;
	const currentConfigContent = selectedTemplate?.configContent || '';

	useEffect(() => {
		if (!superToken) {
			setError('缺少管理员令牌');
			return;
		}
		loadTemplates();
	}, [superToken]);

	const loadTemplates = async () => {
		console.log('loadTemplates called');
		try {
			setLoading(true);
			const apiUrl = `/api/admin/templates?superToken=${superToken}`;
			console.log('Fetching templates from:', apiUrl);
			const response = await fetch(apiUrl);
			console.log('Response status:', response.status);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			const result = await response.json();
			console.log('API response:', result);

			if (result.code === 0) {
				const currentTemplates = templates;
				const templateItems: TemplateItem[] = result.data.templates.map((t: ConfigTemplate) => ({
					...t,
					configContent: t.content || '',
					isSelected:
						currentTemplates.length === 0
							? t.id === result.data.templates[0]?.id
							: currentTemplates.some((x) => x.id === t.id && x.isSelected),
				}));
				// 确保至少有一个选中的模板
				if (templateItems.length > 0 && !templateItems.some((t) => t.isSelected)) {
					templateItems[0].isSelected = true;
				}
				console.log('Setting templates:', templateItems);
				setTemplates(templateItems);
			} else {
				throw new Error(result.msg || '获取模板失败');
			}
			setError(null);
		} catch (err) {
			console.error('Error loading templates:', err);
			setError(err instanceof Error ? err.message : '加载模板失败');
		} finally {
			setLoading(false);
		}
	};

	const handleSelectTemplate = (templateId: string) => {
		setTemplates((prev) =>
			prev.map((template) => ({
				...template,
				isSelected: template.id === templateId,
			})),
		);
		setIsEditing(false);
		setValidationErrors([]);
	};

	const handleStartEdit = () => {
		setIsEditing(true);
	};

	const handleCreateTemplate = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/admin/templates?superToken=${superToken}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: '新配置模板',
					description: '新创建的配置模板',
					type: 'clash',
					content: `# 新配置模板
# 请在此处编辑您的配置`,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			if (result.code === 0) {
				const newTemplate: TemplateItem = {
					...result.data,
					configContent: result.data.content || '',
					isSelected: true,
				};

				setTemplates((prev) => prev.map((t) => ({ ...t, isSelected: false })).concat({ ...newTemplate, isSelected: true }));
				setIsEditing(true);
			} else {
				throw new Error(result.msg || '创建模板失败');
			}
		} catch (err) {
			showToast('创建模板失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteTemplate = async (templateId: string, e: any) => {
		if (e && typeof e.stopPropagation === 'function') {
			e.stopPropagation();
		}
		if (templates.length <= 1) {
			showToast('至少需要保留一个模板', 'error');
			return;
		}

		setTemplateToDelete(templateId);
		openDeleteModal();
	};

	const confirmDeleteTemplate = async () => {
		if (!templateToDelete) return;

		try {
			setLoading(true);
			const response = await fetch(`/api/admin/templates/${templateToDelete}?superToken=${superToken}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			if (result.code === 0) {
				setTemplates((prev) => {
					const newTemplates = prev.filter((t) => t.id !== templateToDelete);
					if (newTemplates.length > 0 && !newTemplates.some((t) => t.isSelected)) {
						newTemplates[0].isSelected = true;
					}
					return newTemplates;
				});
				setIsEditing(false);
				closeDeleteModal();
			} else {
				throw new Error(result.msg || '删除模板失败');
			}
		} catch (err) {
			showToast('删除模板失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
			closeDeleteModal();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateTemplate = (field: keyof TemplateItem, value: any) => {
		if (!selectedTemplate) return;

		setTemplates((prev) => prev.map((template) => (template.id === selectedTemplate.id ? { ...template, [field]: value } : template)));
	};

	const handleUpdateConfigContent = (content: string) => {
		if (!selectedTemplate) return;

		setTemplates((prev) =>
			prev.map((template) => (template.id === selectedTemplate.id ? { ...template, configContent: content } : template)),
		);
	};

	const handleSave = async () => {
		if (!selectedTemplate) return;

		try {
			setSaving(true);

			const response = await fetch(`/api/admin/templates/${selectedTemplate.id}?superToken=${superToken}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: selectedTemplate.name,
					description: selectedTemplate.description || '配置模板',
					type: selectedTemplate.type,
					content: selectedTemplate.configContent,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			if (result.code === 0) {
				const updatedTemplate = {
					...selectedTemplate,
					...result.data,
					lastModified: new Date().toISOString().split('T')[0],
				};

				setTemplates((prev) => prev.map((template) => (template.id === selectedTemplate.id ? updatedTemplate : template)));
				setIsEditing(false);
				showToast('模板保存成功！', 'success');
			} else {
				throw new Error(result.msg || '保存失败');
			}
		} catch (err) {
			showToast('保存失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		setIsEditing(false);
		loadTemplates();
	};

	const handleDownloadTemplate = () => {
		if (!selectedTemplate) return;

		const url = `/api/subscription/template/${selectedTemplate.id}?download=true&filename=${encodeURIComponent(selectedTemplate.name)}.yaml`;
		const a = document.createElement('a');
		a.href = url;
		a.download = `${selectedTemplate.name}.yaml`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const handleCopyConfigContent = async () => {
		if (!selectedTemplate?.configContent) {
			showToast('没有可复制的配置内容', 'error');
			return;
		}

		try {
			await navigator.clipboard.writeText(selectedTemplate.configContent);
			showToast('配置内容已复制到剪贴板', 'success');
		} catch (err) {
			showToast('复制失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
		}
	};

	return {
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
		templateToDelete,
		modalMessage,

		// 操作函数
		loadTemplates,
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

		// 模态框控制
		closeDeleteModal,
		closeErrorModal,
		openDeleteModal,
		setValidationErrors,
	};
};
