import { usePageTitle } from '@/hooks/usePageTitle';
import { useToastContext } from '@/providers/toast-provider';
import type { ConfigTemplate } from '@/types/user-config';
import { useEffect, useRef, useState } from 'react';
import type { TemplateItem } from '../components/TemplateList';
import { templateService } from '@/services/template-api';
import { minimalVisualTemplateModel } from '../visual-template/fixtures';
import { extractVisualModelFromContent, normalizeVisualTemplateContent, stripVisualModelMetadata } from '../visual-template/metadata';
import { composeVisualTemplateContent } from '../visual-template/compose';
import { normalizeVisualTemplateModel } from '../visual-template/normalizer';
import { validateTemplateSemantics } from '../visual-template/validate';

const DEFAULT_VISUAL_TEMPLATE_BASE_CONTENT = '# 可选：在这里保留原始 YAML 片段，最终输出时会与可视化 JSON 合并\n';

export interface UseTemplateManagementProps {
	initialTemplates?: TemplateItem[];
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
	isDirty: boolean;
	validationErrors: string[];

	// 模态框状态
	isDeleteModalOpen: boolean;
	isErrorModalOpen: boolean;
	isDiscardModalOpen: boolean;
	templateToDelete: string | null;

	// 操作函数
	loadTemplates: () => void;
	handleSelectTemplate: (templateId: string) => void;
	handleEditTemplate: (templateId: string) => void;
	handleCreateTemplate: () => void;
	handleCreateVisualTemplate: () => void;
	handleDeleteTemplate: (templateId: string) => void;
	confirmDeleteTemplate: () => void;
	handleUpdateTemplate: (field: keyof TemplateItem, value: unknown) => void;
	handleUpdateConfigContent: (content: string) => void;
	handleSave: () => void;
	handleReset: () => void;
	handleDownloadTemplate: () => void;
	handleCopyConfigContent: () => void;
	handleCopyTemplateUrl: () => void;

	// 模态框控制
	closeDeleteModal: () => void;
	closeErrorModal: () => void;
	openDeleteModal: () => void;
	closeDiscardModal: () => void;
	confirmDiscard: () => void;
	setValidationErrors: (errors: string[]) => void;
}

/**
 * 模板管理Hook - 处理模板数据的CRUD操作
 */
export const useTemplateManagement = ({
	initialTemplates = [],
}: UseTemplateManagementProps): UseTemplateManagementReturn => {

	// 设置页面标题
	usePageTitle('配置模板');

	// Toast hook
	const { showToast } = useToastContext();

	// 数据状态
	const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
	const [loading, setLoading] = useState(initialTemplates.length === 0);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	// 模态框状态
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
	const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

	// 脏检查：每个模板保存时的快照；编辑中与当前内容不一致即为未保存。
	const pristineRef = useRef(new Map<string, string>());
	const pendingDiscardRef = useRef<(() => void) | null>(null);
	const snapshotOf = (template: Pick<TemplateItem, 'name' | 'description' | 'configContent' | 'format' | 'visualModel'>) =>
		JSON.stringify({
			name: template.name,
			description: template.description,
			configContent: template.configContent,
			format: template.format,
			visualModel: template.visualModel ?? null,
		});

	const openDeleteModal = () => setIsDeleteModalOpen(true);
	const closeDeleteModal = () => setIsDeleteModalOpen(false);
	const closeErrorModal = () => setIsErrorModalOpen(false);
	const closeDiscardModal = () => {
		pendingDiscardRef.current = null;
		setIsDiscardModalOpen(false);
	};
	const confirmDiscard = () => {
		const action = pendingDiscardRef.current;
		pendingDiscardRef.current = null;
		setIsDiscardModalOpen(false);
		action?.();
	};

	// 计算属性
	const selectedTemplate = templates.find((t) => t.isSelected) || null;
	const currentConfigContent = selectedTemplate?.configContent || '';
	const isDirty = Boolean(
		isEditing &&
		selectedTemplate &&
		pristineRef.current.get(String(selectedTemplate.id)) !== undefined &&
		pristineRef.current.get(String(selectedTemplate.id)) !== snapshotOf(selectedTemplate),
	);

	// 有未保存修改时先确认，再执行切换/取消动作。
	const guardDirty = (action: () => void) => {
		if (isDirty) {
			pendingDiscardRef.current = action;
			setIsDiscardModalOpen(true);
		} else {
			action();
		}
	};

	useEffect(() => {
		if (initialTemplates.length > 0) {
			setLoading(false);
			return;
		}
		loadTemplates();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialTemplates.length]);

	const loadTemplates = async () => {
		console.log('loadTemplates called');
		try {
			setLoading(true);
			console.log('Fetching templates from API');
			const response = await templateService.getTemplates();
			console.log('API response:', response);

			if (response.code === 0) {
				const currentTemplates = templates;
				const templateItems: TemplateItem[] = response.data.templates.map((t: ConfigTemplate) => {
					const legacyVisualModel = extractVisualModelFromContent(t.content || '');
					const visualModel = normalizeVisualTemplateModel(t.visualModel) ?? legacyVisualModel;
					const content = visualModel || t.format === 'visual-v1'
						? stripVisualModelMetadata(t.content || '')
						: normalizeVisualTemplateContent(t.content || '');
					return {
						...t,
						format: visualModel || t.format === 'visual-v1' ? 'visual-v1' : 'yaml',
						visualModel,
						content,
						configContent: content,
						isSelected:
							currentTemplates.length === 0
								? t.id === response.data.templates[0]?.id
								: currentTemplates.some((x) => x.id === t.id && x.isSelected),
					};
				});
				// 确保至少有一个选中的模板
				if (templateItems.length > 0 && !templateItems.some((t) => t.isSelected)) {
					templateItems[0].isSelected = true;
				}
				console.log('Setting templates:', templateItems);
				pristineRef.current = new Map(templateItems.map((item) => [String(item.id), snapshotOf(item)]));
				setTemplates(templateItems);
			} else {
				throw new Error(response.msg || '获取模板失败');
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
		const applySelect = () => {
			setTemplates((prev) =>
				prev.map((template) => ({
					...template,
					isSelected: String(template.id) === templateId,
				})),
			);
			setIsEditing(false);
			setValidationErrors([]);
		};
		// 切换模板时有未保存修改需先确认。
		if (String(selectedTemplate?.id) !== templateId) {
			guardDirty(applySelect);
		} else {
			applySelect();
		}
	};

	// 列表条目上的编辑：先选中目标模板再进入编辑态；切换目标且有未保存修改时先确认。
	const handleEditTemplate = (templateId: string) => {
		const applyEdit = () => {
			setTemplates((prev) =>
				prev.map((template) => ({
					...template,
					isSelected: String(template.id) === templateId,
				})),
			);
			setValidationErrors([]);
			setIsEditing(true);
		};
		if (String(selectedTemplate?.id) !== templateId) {
			guardDirty(applyEdit);
		} else {
			applyEdit();
		}
	};

	const handleCreateTemplate = async () => {
		try {
			setLoading(true);
			const response = await templateService.createTemplate({
				name: '新配置模板',
				description: '新创建的配置模板',
				content: `# 新配置模板
# 请在此处编辑您的配置`,
			});

			if (response.code === 0) {
				const newTemplate: TemplateItem = {
					...response.data.template,
					configContent: response.data.template.content || '',
					isSelected: true,
				};

				pristineRef.current.set(String(newTemplate.id), snapshotOf(newTemplate));
				setTemplates((prev) => prev.map((t) => ({ ...t, isSelected: false })).concat({ ...newTemplate, isSelected: true }));
				setIsEditing(true);
			} else {
				throw new Error(response.msg || '创建模板失败');
			}
		} catch (err) {
			showToast('创建模板失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateVisualTemplate = async () => {
		try {
			setLoading(true);
			const response = await templateService.createTemplate({
				name: '新可视化模板',
				description: 'visual-v1',
				format: 'visual-v1',
				content: DEFAULT_VISUAL_TEMPLATE_BASE_CONTENT,
				visualModel: minimalVisualTemplateModel,
			});

			if (response.code === 0) {
				const newTemplate: TemplateItem = {
					...response.data.template,
					format: 'visual-v1',
					visualModel: response.data.template.visualModel ?? minimalVisualTemplateModel,
					configContent: response.data.template.content || '',
					isSelected: true,
				};

				pristineRef.current.set(String(newTemplate.id), snapshotOf(newTemplate));
				setTemplates((prev) => prev.map((t) => ({ ...t, isSelected: false })).concat({ ...newTemplate, isSelected: true }));
				setIsEditing(true);
			} else {
				throw new Error(response.msg || '创建模板失败');
			}
		} catch (err) {
			showToast('创建可视化模板失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteTemplate = (templateId: string) => {
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
			const response = await templateService.deleteTemplate(templateToDelete);

			if (response.code === 0) {
				setTemplates((prev) => {
					const newTemplates = prev.filter((t) => String(t.id) !== templateToDelete);
					if (newTemplates.length > 0 && !newTemplates.some((t) => t.isSelected)) {
						newTemplates[0].isSelected = true;
					}
					return newTemplates;
				});
				setIsEditing(false);
				closeDeleteModal();
			} else {
				throw new Error(response.msg || '删除模板失败');
			}
		} catch (err) {
			showToast('删除模板失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
			closeDeleteModal();
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateTemplate = (field: keyof TemplateItem, value: unknown) => {
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

		// 保存前的语义校验：策略重名、坏正则、非法 URL 等不能入库。
		const semanticErrors = validateTemplateSemantics({
			name: selectedTemplate.name,
			format: selectedTemplate.format,
			content: selectedTemplate.configContent,
			visualModel: selectedTemplate.visualModel,
		});
		if (semanticErrors.length > 0) {
			setValidationErrors(semanticErrors);
			showToast(`保存前请修正 ${semanticErrors.length} 个问题`, 'error');
			return;
		}

		try {
			setSaving(true);

			const response = await templateService.updateTemplate(String(selectedTemplate.id), {
				name: selectedTemplate.name,
				description: selectedTemplate.description || '配置模板',
				content: selectedTemplate.configContent,
				format: selectedTemplate.format,
				visualModel: selectedTemplate.format === 'visual-v1' ? selectedTemplate.visualModel ?? null : null,
			});

			if (response.code === 0) {
				// 如果后端没有返回完整的 template，我们至少知道更新成功了
				// 可以从 selectedTemplate 和请求数据构造更新
				// 或者假设后端返回了 { template: ... }
				const updatedData = response.data.template || ({} as Partial<ConfigTemplate>);

				const updatedTemplate: TemplateItem = {
					...selectedTemplate,
					...updatedData,
					configContent: updatedData.content || selectedTemplate.configContent,
				};

				pristineRef.current.set(String(updatedTemplate.id), snapshotOf(updatedTemplate));
				setTemplates((prev) => prev.map((template) => (template.id === selectedTemplate.id ? updatedTemplate : template)));
				setIsEditing(false);
				showToast('模板保存成功！', 'success');
			} else {
				throw new Error(response.msg || '保存失败');
			}
		} catch (err) {
			showToast('保存失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		// 取消编辑时有未保存修改需先确认。
		guardDirty(() => {
			setIsEditing(false);
			loadTemplates();
		});
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
		if (!selectedTemplate?.configContent && selectedTemplate?.format !== 'visual-v1') {
			showToast('没有可复制的配置内容', 'error');
			return;
		}

		try {
			const content = selectedTemplate.format === 'visual-v1'
				? composeVisualTemplateContent(selectedTemplate.configContent || '', selectedTemplate.visualModel)
				: selectedTemplate.configContent || '';
			await navigator.clipboard.writeText(content);
			showToast('配置内容已复制到剪贴板', 'success');
		} catch (err) {
			showToast('复制失败：' + (err instanceof Error ? err.message : '未知错误'), 'error');
		}
	};

	const handleCopyTemplateUrl = async () => {
		if (!selectedTemplate) {
			showToast('没有选中的模板', 'error');
			return;
		}

		try {
			const templateUrl = `${window.location.origin}/api/subscription/template/${selectedTemplate.id}`;
			await navigator.clipboard.writeText(templateUrl);
			showToast('模板链接已复制到剪贴板', 'success');
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
		isDirty,
		validationErrors,

		// 模态框状态
		isDeleteModalOpen,
		isErrorModalOpen,
		isDiscardModalOpen,
		templateToDelete,

		// 操作函数
		loadTemplates,
		handleSelectTemplate,
		handleEditTemplate,
		handleCreateTemplate,
		handleCreateVisualTemplate,
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
		openDeleteModal,
		closeDiscardModal,
		confirmDiscard,
		setValidationErrors,
	};
};
