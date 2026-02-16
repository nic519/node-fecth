/* eslint-disable @typescript-eslint/no-explicit-any */
import { YamlEditor } from '@/components/YamlEditor';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';
import { ValidationMessage } from './ValidationMessage';
import { BookOpen, CheckCircle } from 'lucide-react';

interface ConfigEditorProps {
	uid: string;
	token: string;
	configContent: string;
	validationErrors: string[];
	configPreview: any | null;
	onConfigContentChange: (content: string) => void;
	onYamlSyntaxErrorsChange: (errors: string[]) => void;
	onToggleHelp: () => void;
}

export function ConfigEditor({
	uid,
	token,
	configContent,
	validationErrors,
	configPreview,
	onConfigContentChange,
	onYamlSyntaxErrorsChange,
	onToggleHelp,
}: ConfigEditorProps) {
	return (
		<Card className="w-full flex flex-col shadow-sm border border-gray-200 bg-white rounded-xl overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-white space-y-0">
				<div className="flex flex-row items-center gap-4">
					<h3 className="text-lg font-bold text-gray-900">配置编辑器</h3>
					{validationErrors.length === 0 && configPreview && (
						<div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
							<CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
							配置格式正确
						</div>
					)}
				</div>
				<Button
					onClick={onToggleHelp}
					variant="secondary"
					size="sm"
					className="lg:hidden bg-gray-100 text-gray-700 font-medium"
				>
					<BookOpen className="w-4 h-4 mr-2" />
					配置说明
				</Button>
			</CardHeader>
			<Separator />

			<CardContent className="flex-1 flex flex-col min-h-0 p-0">
				{/* 验证消息 */}
				{validationErrors.length > 0 && (
					<div className="px-6 pt-6">
						<ValidationMessage validationErrors={validationErrors} />
					</div>
				)}

				{/* YAML 编辑器区域 */}
				<div className="flex-1 min-h-[500px] relative border-y border-gray-100">
					<YamlEditor
						value={configContent}
						onChange={onConfigContentChange}
						height="100%"
						readOnly={false}
						onValidate={onYamlSyntaxErrorsChange}
					/>
				</div>

				{/* 底部操作区域 */}
				<div className="sticky bottom-0 left-0 right-0 z-20 flex-shrink-0 p-6 bg-gray-50/80 border-t border-gray-100 backdrop-blur-sm">
					<SubscribeUrlPanel uid={uid} token={token} />
				</div>
			</CardContent>
		</Card>
	);
}
