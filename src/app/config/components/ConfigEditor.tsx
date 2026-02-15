import { YamlEditor } from '@/components/YamlEditor';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';
import { ValidationMessage } from './ValidationMessage';

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
		<Card className="w-full flex flex-col shadow-md">
			<CardHeader className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
				<div>
					<h3 className="text-lg font-semibold">YAML 配置</h3>
					<p className="text-sm text-default-500 mt-1">编辑您的用户配置，保存后立即生效</p>
				</div>
				<Button onClick={onToggleHelp} variant="bordered" size="sm" className="lg:hidden">
					字段说明
				</Button>
			</CardHeader>

			<CardBody className="flex-1 flex flex-col min-h-0 p-6 pt-0">
				{/* 验证消息 */}
				<ValidationMessage validationErrors={validationErrors} configPreview={configPreview} />

				{/* YAML 编辑器区域 */}
				<div className="flex-1 min-h-[400px] mb-6">
					<YamlEditor
						value={configContent}
						onChange={onConfigContentChange}
						height="100%"
						readOnly={false}
						onValidate={onYamlSyntaxErrorsChange}
					/>
				</div>

				{/* 底部操作区域 */}
				<div className="flex-shrink-0">
					<SubscribeUrlPanel uid={uid} token={token} />
				</div>
			</CardBody>
		</Card>
	);
}
