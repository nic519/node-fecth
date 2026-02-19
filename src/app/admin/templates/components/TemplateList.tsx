'use client';

import type { ConfigTemplate } from '@/types/user-config';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

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
						"cursor-pointer transition-colors relative group px-2 py-1.5 rounded-sm select-none",
						template.isSelected
							? "bg-accent/80 text-accent-foreground font-medium"
							: "hover:bg-accent/40 text-muted-foreground hover:text-foreground"
					)}
					onClick={() => onSelectTemplate(String(template.id))}
				>
					<div className="flex flex-col gap-0.5 min-w-0">
						<div className="flex items-center justify-between gap-2">
							<span className="text-sm truncate leading-none">
								{template.name}
							</span>
						</div>
						<p className={cn(
							"text-xs truncate transition-colors",
							template.isSelected ? "text-accent-foreground/70" : "text-muted-foreground/60 group-hover:text-muted-foreground/80"
						)}>
							{template.description || '无描述'}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
