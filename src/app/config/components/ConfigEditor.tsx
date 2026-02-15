import { YamlEditor } from '@/components/YamlEditor';
import { Button, Card, CardBody, CardHeader, Divider } from '@heroui/react';
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
		<Card className="w-full flex flex-col shadow-sm border border-gray-200 bg-white rounded-xl overflow-hidden">
			<CardHeader className="flex items-center justify-between px-6 py-4 bg-white">
				<div>
					<h3 className="text-lg font-bold text-gray-900">配置编辑器</h3>
					<p className="text-sm text-gray-500 mt-1">
                        直接编辑 YAML 配置文件，保存后即时生效
                    </p>
				</div>
				<Button 
                    onPress={onToggleHelp} 
                    variant="flat" 
                    size="sm" 
                    className="lg:hidden bg-gray-100 text-gray-700 font-medium"
                    startContent={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                    }
                >
					配置说明
				</Button>
			</CardHeader>
            <Divider className="bg-gray-100" />

			<CardBody className="flex-1 flex flex-col min-h-0 p-0">
				{/* 验证消息 */}
                <div className="px-6 pt-6">
				    <ValidationMessage validationErrors={validationErrors} configPreview={configPreview} />
                </div>

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
				<div className="flex-shrink-0 p-6 bg-gray-50/50">
					<SubscribeUrlPanel uid={uid} token={token} />
				</div>
			</CardBody>
		</Card>
	);
}
