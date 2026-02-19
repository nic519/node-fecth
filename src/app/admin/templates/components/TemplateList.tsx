'use client';

import type { ConfigTemplate } from '@/types/user-config';
import { Card, CardContent } from '@/components/ui/card';
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
	onDeleteTemplate: (id: string) => void;
	onStartEdit: () => void;
}

export function TemplateList({ templates, onSelectTemplate, onDeleteTemplate, onStartEdit }: TemplateListProps) {
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
						"cursor-pointer transition-all relative group px-3 py-3 rounded-lg border border-transparent",
						template.isSelected 
							? "bg-primary/5 border-primary/10 shadow-sm" 
							: "hover:bg-muted/50 hover:border-border/40"
					)}
					onClick={() => onSelectTemplate(String(template.id))}
				>
					<div className="flex justify-between items-start gap-3">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h3 className={cn("text-sm font-medium truncate transition-colors", template.isSelected ? "text-primary" : "text-foreground")}>
									{template.name}
								</h3>
								<span className="text-[10px] text-muted-foreground/50 font-mono shrink-0 px-1.5 py-0.5 bg-muted rounded">
									#{template.id.substring(0, 6)}
								</span>
							</div>
							<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
								{template.description || '无描述'}
							</p>
						</div>
						
                        <div className={cn(
							"flex flex-col gap-1 transition-opacity duration-200",
							template.isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
						)}>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTemplate(String(template.id));
                                    onStartEdit();
                                }}
                            >
                                <PencilIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTemplate(String(template.id));
                                }}
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
					</div>
				</div>
			))}
		</div>
	);
}
