import type { ConfigTemplate } from '@/types/user-config';
import { CheckCircleIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';

export interface TemplateItem extends ConfigTemplate {
	isSelected?: boolean;
	configContent?: string;
}

interface TemplateListProps {
	templates: TemplateItem[];
	onSelectTemplate: (templateId: string) => void;
	onDeleteTemplate: (templateId: string, e: any) => void;
	headerAction?: React.ReactNode;
}

export function TemplateList({ templates, onSelectTemplate, onDeleteTemplate, headerAction }: TemplateListProps) {
	return (
		<Card className="flex flex-col h-full">
			<CardHeader className="px-6 py-4 border-b border-gray-200">
				<div className="flex justify-between items-center w-full">
					<div className="flex-1">
						<h3 className="text-lg font-semibold text-gray-900">配置模板</h3>
						<p className="text-sm text-gray-500 mt-1">管理多个配置模板</p>
					</div>
					{headerAction && (
						<div className="flex-shrink-0 ml-4">
							{headerAction}
						</div>
					)}
				</div>
			</CardHeader>

			{/* 模板列表 */}
			<CardBody className="flex-1 overflow-y-auto p-0">
				{templates.map((template) => (
					<div
						key={template.id}
						className={`border-b border-gray-100 last:border-b-0 transition-all duration-200 ${
							template.isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
						}`}
					>
						<div className="px-6 py-4 cursor-pointer" onClick={() => onSelectTemplate(String(template.id))}>
							<div className="flex items-start justify-between">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-2">
										<DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
										<span className="font-medium text-gray-900 truncate">{template.name}</span>
										{template.isSelected && <CheckCircleIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />}
									</div>
									<div className="text-xs text-gray-500">修改于: {template.updatedAt.split('T')[0]}</div>
								</div>
								<div className="flex items-center gap-1">
									<Button
										isIconOnly
										size="sm"
										variant="light"
										color="danger"
										onPress={(e) => onDeleteTemplate(String(template.id), e)}
										disabled={templates.length <= 1}
										title="删除模板"
									>
										<TrashIcon className="w-4 h-4" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				))}
			</CardBody>
		</Card>
	);
}
