'use client';

import { YamlEditor } from '@/components/YamlEditor';
import { DocumentArrowDownIcon, LinkIcon } from '@heroicons/react/24/outline';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
			{/* 头部 - 编辑按钮 */}
			{!isEditing && (
				<CardHeader className="px-6 py-3 border-b border-gray-200 flex flex-row justify-end space-y-0">
					<Button onClick={onStartEdit} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
						开始编辑
					</Button>
				</CardHeader>
			)}

			{/* 编辑器区域 */}
			<CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
				{isEditing && (
					<div className="mb-4 space-y-3">
						<div className="space-y-1.5">
							<Label>模板名称</Label>
							<Input
								value={selectedTemplate.name}
								onChange={(e) => onUpdateTemplate('name', e.target.value)}
							/>
						</div>
					</div>
				)}

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
				<div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
					<div className="flex gap-2">
						<Button
							onClick={onDownloadTemplate}
							size="sm"
							variant="default"
							className="bg-blue-600 text-white hover:bg-blue-700"
						>
							<DocumentArrowDownIcon className="w-4 h-4 mr-2" />
							下载配置
						</Button>
						<Button size="sm" variant="secondary" onClick={onCopyConfigContent}>
							复制配置
						</Button>
						<Button
							size="sm"
							variant="default"
							className="bg-green-600 text-white hover:bg-green-700"
							onClick={onCopyTemplateUrl}
						>
							<LinkIcon className="w-4 h-4 mr-2" />
							复制链接
						</Button>
					</div>
					{isEditing && (
						<div className="flex gap-2">
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
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
