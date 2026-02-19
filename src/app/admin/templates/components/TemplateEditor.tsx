'use client';

import { YamlEditor } from '@/components/YamlEditor';
import { DocumentArrowDownIcon, LinkIcon, ClipboardDocumentIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
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
	onDeleteTemplate: () => void;
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
	onDeleteTemplate,
	onUpdateTemplate,
	onUpdateConfigContent,
	onValidate,
	onDownloadTemplate,
	onReset,
	onSave,
	onCopyConfigContent,
	onCopyTemplateUrl,
	saving,
}: TemplateEditorProps) {
	if (!selectedTemplate) {
		return (
			<div className="h-full flex flex-col items-center justify-center text-muted-foreground">
				<div className="flex flex-col items-center justify-center p-8 text-center">
					<div className="mx-auto h-12 w-12 text-muted-foreground/50 flex items-center justify-center mb-4 bg-muted/30 rounded-full p-2">
						<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 className="mt-2 text-sm font-medium text-foreground">未选择模板</h3>
					<p className="mt-1 text-sm text-muted-foreground">请从左侧选择一个配置模板进行编辑</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-transparent">
			{/* 头部 - 标题与操作按钮 */}
			<div className="px-6 py-3 flex flex-row justify-between items-center space-y-0 h-14 border-b border-border/40 shrink-0">
				{/* 左侧 - 标题/编辑框 */}
				<div className="flex-1 mr-4">
					{isEditing ? (
						<Input
							value={selectedTemplate.name}
							onChange={(e) => onUpdateTemplate('name', e.target.value)}
							className="max-w-md font-medium text-lg h-9 bg-transparent border-transparent hover:bg-muted/50 focus:bg-background focus:border-border transition-all px-2 -ml-2"
							placeholder="输入模板名称"
						/>
					) : (
						<div className="flex flex-col">
							<h3 className="text-lg font-bold text-foreground truncate" title={selectedTemplate.name}>
								{selectedTemplate.name}
							</h3>
							{selectedTemplate.description && (
								<p className="text-xs text-muted-foreground truncate max-w-xl">
									{selectedTemplate.description}
								</p>
							)}
						</div>
					)}
				</div>

				{/* 右侧 - 操作按钮 */}
				<div className="flex items-center gap-1">
					{!isEditing && (
						<>
							<Button
								onClick={onStartEdit}
								size="sm"
								className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none mr-2"
							>
								<PencilIcon className="w-3.5 h-3.5 mr-1.5" />
								编辑
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={onDeleteTemplate}
								title="删除模板"
								className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-1"
							>
								<TrashIcon className="w-4 h-4" />
							</Button>
							<div className="w-px h-4 bg-border/60 mx-1" />
						</>
					)}

					<Button
						variant="ghost"
						size="icon"
						onClick={onDownloadTemplate}
						title="下载配置"
						className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
					>
						<DocumentArrowDownIcon className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCopyConfigContent}
						title="复制配置"
						className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
					>
						<ClipboardDocumentIcon className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCopyTemplateUrl}
						title="复制链接"
						className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
					>
						<LinkIcon className="w-4 h-4" />
					</Button>

					{isEditing && (
						<>
							<div className="w-px h-4 bg-border/60 mx-1" />
							<Button onClick={onReset} variant="ghost" size="sm" className="h-8 hover:bg-muted/80">
								取消
							</Button>
							<Button
								onClick={onSave}
								disabled={saving || validationErrors.length > 0}
								size="sm"
								className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-none disabled:opacity-50"
							>
								{saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
								保存
							</Button>
						</>
					)}
				</div>
			</div>

			{/* 编辑器区域 */}
			<div className="flex-1 flex flex-col overflow-hidden relative group">
				{/* 描述编辑区域 (仅编辑模式显示) */}
				{isEditing && (
					<div className="px-6 py-4 border-b border-border/40 bg-muted/10 shrink-0">
						<Label className="text-xs font-medium text-muted-foreground mb-1.5 block">模板描述</Label>
						<Textarea
							value={selectedTemplate.description || ''}
							onChange={(e) => onUpdateTemplate('description', e.target.value)}
							placeholder="请输入模板描述..."
							rows={1}
							className="resize-none text-sm min-h-[38px] bg-transparent border-border/40 focus:bg-background focus:border-primary/50 transition-all"
						/>
					</div>
				)}

				{/* 语法错误提示 - 浮动在编辑器上方 */}
				{validationErrors.length > 0 && (
					<div className="absolute top-2 right-4 z-20 bg-destructive/90 text-destructive-foreground text-xs px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm animate-in fade-in slide-in-from-top-2 flex items-center">
						<svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
						<span>{validationErrors.length} 个语法错误</span>
					</div>
				)}

				{/* YAML 编辑器 - 无边框，透明背景 */}
				<div className="flex-1 min-h-0 relative">
					<YamlEditor
						key={selectedTemplate?.id}
						value={currentConfigContent}
						onChange={onUpdateConfigContent}
						height="100%"
						readOnly={!isEditing}
						onValidate={onValidate}
						bordered={false}
						transparent={true}
						className="bg-transparent"
					/>
				</div>

				{/* 验证错误详情 - 底部抽屉式 */}
				{validationErrors.length > 0 && (
					<div className="absolute bottom-0 left-0 right-0 bg-destructive/10 border-t border-destructive/20 backdrop-blur-md p-3 max-h-[150px] overflow-y-auto z-10">
						<h4 className="text-xs font-medium text-destructive mb-1.5">语法错误详情：</h4>
						<ul className="text-xs text-destructive/90 space-y-1 font-mono">
							{validationErrors.map((error, index) => (
								<li key={index} className="flex items-start">
									<span className="mr-2 opacity-70">•</span>
									<span>{error}</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
