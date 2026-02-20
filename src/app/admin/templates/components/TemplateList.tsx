'use client';

import type { ConfigTemplate } from '@/types/user-config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TemplateItem extends ConfigTemplate {
	configContent?: string;
	isSelected?: boolean;
}

interface TemplateListProps {
	templates: TemplateItem[];
	onSelectTemplate: (id: string) => void;
}

export function TemplateList({ templates, onSelectTemplate }: TemplateListProps) {
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
						"cursor-pointer transition-all relative group px-3 py-2.5 rounded-md select-none border border-transparent",
						template.isSelected
							? "bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-700 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/50 shadow-sm"
							: "hover:bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border/50"
					)}
					onClick={() => onSelectTemplate(String(template.id))}
				>
					<div className="flex flex-col gap-1 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<span className={cn("text-sm font-medium truncate leading-none", template.isSelected ? "text-violet-900 dark:text-violet-100" : "")}>
								{template.name}
							</span>
						</div>
						<p className={cn(
							"text-xs truncate transition-colors",
							template.isSelected ? "text-violet-600/80 dark:text-violet-400/80" : "text-muted-foreground/60 group-hover:text-muted-foreground/80"
						)}>
							{template.description || '无描述'}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
