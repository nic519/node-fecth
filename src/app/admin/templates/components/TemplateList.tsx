'use client';

import type { ConfigTemplate } from '@/types/user-config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrashIcon } from '@heroicons/react/24/outline';

export interface TemplateItem extends ConfigTemplate {
    configContent?: string;
    isSelected?: boolean;
}

interface TemplateListProps {
	templates: TemplateItem[];
	onSelectTemplate: (id: string) => void;
	onDeleteTemplate: (id: string) => void;
}

export function TemplateList({ templates, onSelectTemplate, onDeleteTemplate }: TemplateListProps) {
	if (templates.length === 0) {
		return (
			<Card className="bg-white rounded-lg shadow-sm">
				<CardContent className="p-8 text-center text-gray-500">
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
						"cursor-pointer transition-all border relative group hover:shadow-md bg-white",
                        template.isSelected ? "border-blue-500 ring-1 ring-blue-500 shadow-md" : "border-gray-200 hover:border-blue-300"
					)}
                    onClick={() => onSelectTemplate(String(template.id))}
				>
					<CardContent className="p-4">
						<div className="flex justify-between items-start">
							<div>
								<h3 className={cn("font-medium line-clamp-1", template.isSelected ? "text-blue-700" : "text-gray-900")}>
                                    {template.name}
                                </h3>
								<p className="text-xs text-gray-500 mt-1 line-clamp-2">
									{template.description || '无描述'}
								</p>
							</div>
							<Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTemplate(String(template.id));
                                }}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </Button>
						</div>
						<div className="mt-3 flex items-center gap-2">
							<div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">
								ID: {template.id}
							</div>
                            {template.isSelected && (
                                <div className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-600 font-medium">
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
