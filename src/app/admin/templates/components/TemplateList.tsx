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
		<div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 250px)' }}>
			{templates.map((template) => (
				<Card
					key={template.id}
					className={cn(
						"cursor-pointer transition-all border relative group hover:shadow-lg backdrop-blur-sm rounded-xl overflow-hidden",
                        template.isSelected 
							? "bg-white dark:bg-slate-800 border-primary/50 ring-1 ring-primary/20 shadow-md" 
							: "bg-white/80 dark:bg-slate-900/80 border-border/60 hover:border-primary/30 hover:bg-white dark:hover:bg-slate-800/80"
					)}
                    onClick={() => onSelectTemplate(String(template.id))}
				>
                    {template.isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-violet-600" />
                    )}
					<CardContent className="p-4">
						<div className="flex justify-between items-start">
							<div className="flex-1 mr-8">
								<h3 className={cn("font-medium line-clamp-1 transition-colors", template.isSelected ? "text-primary" : "text-foreground group-hover:text-primary/80")}>
                                    {template.name}
                                </h3>
								<p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
									{template.description || '无描述'}
								</p>
							</div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all absolute right-10 top-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTemplate(String(template.id));
                                    onStartEdit();
                                }}
                            >
                                <PencilIcon className="h-4 w-4" />
                            </Button>
							<Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTemplate(String(template.id));
                                }}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
						</div>
						<div className="mt-3 flex items-center gap-2">
							<div className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono border border-border/40">
								ID: {template.id}
							</div>
                            {template.isSelected && (
                                <div className="text-[10px] bg-primary/10 px-2 py-0.5 rounded text-primary font-medium border border-primary/20">
                                    编辑中
                                </div>
                            )}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
