'use client';

import { YamlEditor } from '@/components/YamlEditor';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileDown, Link, Clipboard, Pencil, Trash2, Layout } from 'lucide-react';
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
				<div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
					<div className="mx-auto h-20 w-20 text-violet-500/80 dark:text-violet-400/80 flex items-center justify-center mb-6 bg-gradient-to-br from-violet-100/80 to-indigo-100/80 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-3xl p-5 shadow-sm ring-1 ring-violet-200/60 dark:ring-violet-500/20">
						<Layout className="w-10 h-10" strokeWidth={1.5} />
					</div>
					<h3 className="mt-2 text-lg font-semibold text-foreground bg-clip-text text-transparent bg-gradient-to-br from-zinc-800 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400">未选择模板</h3>
					<p className="mt-2 text-sm text-muted-foreground leading-relaxed">
						请从左侧列表中选择一个配置模板进行编辑，或者点击左上角的“新建”按钮创建一个新模板。
					</p>
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
								className="h-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20 border-0 mr-2 transition-all duration-300"
							>
								<Pencil className="w-3.5 h-3.5 mr-1.5" />
								编辑
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={onDeleteTemplate}
								title="删除模板"
								className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mr-1 transition-colors"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
							<div className="w-px h-4 bg-border/60 mx-1" />
						</>
					)}

					<Button
						variant="ghost"
						size="icon"
						onClick={onDownloadTemplate}
						title="下载配置"
						className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
					>
						<FileDown className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCopyConfigContent}
						title="复制配置"
						className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
					>
						<Clipboard className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onCopyTemplateUrl}
						title="复制链接"
						className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
					>
						<Link className="w-4 h-4" />
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
					<div className="absolute inset-0">
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
