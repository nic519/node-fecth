'use client';

import { YamlEditor } from '@/components/YamlEditor';
import { DocumentArrowDownIcon, LinkIcon, ClipboardDocumentIcon, PencilIcon } from '@heroicons/react/24/outline';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { ConfigTemplate } from '@/types/user-config';

// TemplateItem definition (or import it if it's exported from somewhere)
// Assuming TemplateList exports it or use TemplateConfig
// Let's use ConfigTemplate.

interface TemplateEditorProps {
	selectedTemplate: ConfigTemplate | null;
	isEditing: boolean;
	validationErrors: string[];
	currentConfigContent: string;
	onStartEdit: () => void;
	onUpdateTemplate: (field: keyof ConfigTemplate, value: any) => void;
	onUpdateConfigContent: (content: string) => void;
	onValidate: (errors: string[]) => void;
	onDownloadTemplate: () => void;
	onReset: () => void;
	onSave: () => void;
	onCopyConfigContent: () => void;
	onCopyTemplateUrl: () => void;
	saving: boolean;
	loading?: boolean;
}

export function TemplateEditor({
	selectedTemplate,
	isEditing,
	validationErrors,
	currentConfigContent,
	onStartEdit,
	onUpdateTemplate,
	onUpdateConfigContent,
	onValidate,
	onDownloadTemplate,
	onReset,
	onSave,
	onCopyConfigContent,
	onCopyTemplateUrl,
	saving,
	loading,
}: TemplateEditorProps) {
	if (!selectedTemplate) {
		return (
			<Card className="h-full flex flex-col items-center justify-center text-gray-400 bg-white">
				<CardContent className="flex flex-col items-center justify-center p-8 text-center">
					<div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center mb-4">
						<svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 className="mt-2 text-sm font-medium text-gray-900">未选择模板</h3>
					<p className="mt-1 text-sm text-gray-500">请从左侧选择一个配置模板进行编辑</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="flex flex-col h-full bg-white overflow-hidden">
			{/* 头部 - 标题与操作按钮 */}
			<CardHeader className="px-6 py-3 flex flex-row justify-between items-center space-y-0 h-16">
				{/* 左侧 - 标题/编辑框 */}
				<div className="flex-1 mr-4">
					{isEditing ? (
						<Input
							value={selectedTemplate.name}
							onChange={(e) => onUpdateTemplate('name', e.target.value)}
							className="max-w-md font-medium text-lg h-9"
							placeholder="输入模板名称"
						/>
					) : (
						<h3 className="text-lg font-medium text-gray-900 truncate" title={selectedTemplate.name}>
							{selectedTemplate.name}
						</h3>
					)}
				</div>

				{/* 右侧 - 操作按钮 */}
				<div className="flex items-center gap-1">
					{!isEditing && (
						<>
							<Button
								onClick={onStartEdit}
								size="sm"
								className="bg-blue-600 text-white hover:bg-blue-700 mr-2"
							>
								<PencilIcon className="w-4 h-4 mr-2" />
								编辑
							</Button>
							<div className="w-px h-6 bg-gray-200 mx-2" />
						</>
					)}

					<Button
						variant="ghost"
						size="icon"
						onClick={onDownloadTemplate}
						title="下载配置"
						className="text-gray-500 hover:text-gray-900"
					>
						<DocumentArrowDownIcon className="w-5 h-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCopyConfigContent}
						title="复制配置"
						className="text-gray-500 hover:text-gray-900"
					>
						<ClipboardDocumentIcon className="w-5 h-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCopyTemplateUrl}
						title="复制链接"
						className="text-gray-500 hover:text-gray-900"
					>
						<LinkIcon className="w-5 h-5" />
					</Button>

					{isEditing && (
						<>
							<div className="w-px h-6 bg-gray-200 mx-2" />
							<Button onClick={onReset} variant="secondary" size="sm">
								取消
							</Button>
							<Button
								onClick={onSave}
								disabled={saving || validationErrors.length > 0}
								size="sm"
								className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
							>
								{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								保存配置
							</Button>
						</>
					)}
				</div>
			</CardHeader>

			{/* 编辑器区域 */}
			<CardContent className="flex-1 flex flex-col px-6 pb-6 pt-0 overflow-hidden">
				{/* 描述编辑区域 */}
				<div className="mb-4">
					{isEditing ? (
						<div className="space-y-1.5">
							<Label className="text-xs text-gray-500">模板描述</Label>
							<Textarea
								value={selectedTemplate.description || ''}
								onChange={(e) => onUpdateTemplate('description', e.target.value)}
								placeholder="请输入模板描述..."
								rows={2}
								className="resize-none text-sm"
							/>
						</div>
					) : (
						selectedTemplate.description && (
							<div className="bg-gray-50 p-3 rounded-md border border-gray-100">
								<p className="text-sm text-gray-600 leading-relaxed">
									{selectedTemplate.description}
								</p>
							</div>
						)
					)}
				</div>

				{/* 语法错误提示 */}
				{validationErrors.length > 0 && (
					<div className="mb-3 flex items-center text-sm text-red-600">
						<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
						<span>{validationErrors.length} 个语法错误</span>
					</div>
				)}

				{/* YAML 编辑器 - 占据剩余空间 */}
				<div className="flex-1 min-h-[300px] border rounded-md overflow-hidden">
					<YamlEditor
						key={selectedTemplate?.id}
						value={currentConfigContent}
						onChange={onUpdateConfigContent}
						height="100%"
						readOnly={!isEditing}
						onValidate={onValidate}
					/>
				</div>

				{/* 验证错误详情 */}
				{validationErrors.length > 0 && (
					<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<h4 className="text-sm font-medium text-red-800 mb-2">语法错误：</h4>
						<ul className="text-sm text-red-700 space-y-1">
							{validationErrors.map((error, index) => (
								<li key={index} className="flex items-start">
									<span className="mr-2">•</span>
									<span>{error}</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* 操作按钮 */}
				{/* 底部操作栏已移至顶部 */}
			</CardContent>
		</Card>
	);
}
