'use client';

import type { ConfigTemplate } from '@/types/user-config';
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
					<div className="flex flex-col gap-1 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<span className={cn("text-sm font-medium truncate leading-none", template.isSelected ? "text-accent-foreground" : "")}>
								{template.name}
							</span>
						</div>
						<p className={cn(
							"text-xs truncate transition-colors",
							"text-muted-foreground"
						)}>
							{template.description || '无描述'}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
