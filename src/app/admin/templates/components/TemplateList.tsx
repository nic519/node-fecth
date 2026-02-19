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
			<Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-border/60">
				<CardContent className="p-8 text-center text-muted-foreground">
					暂无模板
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="flex flex-col divide-y divide-border/40">
			{templates.map((template) => (
				<div
					key={template.id}
					className={cn(
						"cursor-pointer transition-all relative group px-4 py-3 hover:bg-muted/50",
						template.isSelected 
							? "bg-primary/5 dark:bg-primary/10" 
							: "bg-transparent"
					)}
					onClick={() => onSelectTemplate(String(template.id))}
				>
                    {template.isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
					<div className="flex justify-between items-start">
						<div className="flex-1 mr-8">
							<h3 className={cn("text-sm font-medium line-clamp-1 transition-colors", template.isSelected ? "text-primary" : "text-foreground")}>
                                {template.name}
                            </h3>
							<p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
								{template.description || '无描述'}
							</p>
						</div>
                        <div className="flex items-center gap-1 absolute right-2 top-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                    "h-7 w-7 transition-all",
                                    template.isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                    "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                )}
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
                                className={cn(
                                    "h-7 w-7 transition-all",
                                    template.isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                                    "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTemplate(String(template.id));
                                }}
                            >
                                <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
					</div>
					<div className="mt-1.5 flex items-center gap-2">
						<span className="text-[10px] text-muted-foreground/60 font-mono">
							#{template.id.substring(0, 8)}
						</span>
					</div>
				</div>
			))}
		</div>
	);
}
