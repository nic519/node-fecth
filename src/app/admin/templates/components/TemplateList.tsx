'use client';

import type { ConfigTemplate } from '@/types/user-config';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatTimestampCN } from '@/utils/relativeTime';

export interface TemplateItem extends ConfigTemplate {
	configContent?: string;
	isSelected?: boolean;
}

interface TemplateListProps {
	templates: TemplateItem[];
	onSelectTemplate: (id: string) => void;
	onEditTemplate: (id: string) => void;
	onDeleteTemplate: (id: string) => void;
}

export function TemplateList({ templates, onSelectTemplate, onEditTemplate, onDeleteTemplate }: TemplateListProps) {
	if (templates.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border/60">
				<p className="text-sm">暂无模板</p>
			</div>
		);
	}

	return (
		<div className="space-y-0.5">
			{templates.map((template) => (
				<div
					key={template.id}
					className={cn(
						"cursor-pointer transition-all relative group px-2.5 py-2 rounded-md select-none border border-transparent flex flex-col gap-1",
						template.isSelected
							? "bg-accent text-accent-foreground"
							: "hover:bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border/50"
					)}
					role="button"
						tabIndex={0}
						aria-pressed={template.isSelected}
						onClick={() => onSelectTemplate(String(template.id))}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								onSelectTemplate(String(template.id));
							}
						}}
				>
					{/* 行1：标题 + 编辑/删除；选中卡片常显，其余悬停/聚焦时显形 */}
					<div className="flex items-center justify-between gap-1.5 min-w-0">
						<span className={cn("text-sm font-medium truncate leading-none", template.isSelected ? "text-accent-foreground" : "")}>
							{template.name}
						</span>
						<div
							className={cn(
								"flex shrink-0 items-center gap-0.5 transition-opacity",
								template.isSelected
									? "opacity-100"
									: "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100"
							)}
						>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground transition-colors hover:text-primary hover:bg-primary/10"
								title="编辑模板"
								aria-label={`编辑模板 ${template.name}`}
								onClick={(event) => {
									event.stopPropagation();
									onEditTemplate(String(template.id));
								}}
								onKeyDown={(event) => event.stopPropagation()}
							>
								<Pencil className="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
								title="删除模板"
								aria-label={`删除模板 ${template.name}`}
								onClick={(event) => {
									event.stopPropagation();
									onDeleteTemplate(String(template.id));
								}}
								onKeyDown={(event) => event.stopPropagation()}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
					{/* 行2：描述 + 相对更新时间（悬浮显示完整创建/更新时间） */}
					<div className="flex items-center justify-between gap-2 min-w-0">
						<p className="text-xs truncate transition-colors text-muted-foreground">
							{template.description || '无描述'}
						</p>
						<span
							className="shrink-0 text-[10px] leading-none text-muted-foreground/80"
							title={`更新于 ${formatTimestampCN(template.updatedAt)} · 创建于 ${formatTimestampCN(template.createdAt)}`}
						>
							{formatRelativeTime(template.updatedAt)}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}
