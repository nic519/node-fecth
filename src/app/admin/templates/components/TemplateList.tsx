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
		<div className="space-y-1">
			{templates.map((template) => (
				<div
					key={template.id}
					className={cn(
						"cursor-pointer transition-all relative group px-3 py-2 rounded-md",
						template.isSelected
							? "bg-accent text-accent-foreground"
							: "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
					)}
					onClick={() => onSelectTemplate(String(template.id))}
				>
					<div className="flex justify-between items-center gap-2">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<h3 className={cn("text-sm font-medium truncate transition-colors", template.isSelected ? "text-primary" : "text-foreground")}>
									{template.name}
								</h3>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
