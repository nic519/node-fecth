import { YamlEditor } from '@/components/YamlEditor';
import { Button } from '@heroui/react';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';
import { ValidationMessage } from './ValidationMessage';

interface ConfigEditorProps {
	uid: string;
	token: string;
	configContent: string;
	validationErrors: string[];
	configPreview: any | null;
	onConfigContentChange: (content: string) => void;
	onToggleHelp: () => void;
}

export function ConfigEditor({
	uid,
	token,
	configContent,
	validationErrors,
	configPreview,
	onConfigContentChange,
	onToggleHelp,
}: ConfigEditorProps) {
	return (
		<div className="bg-white shadow rounded-lg w-full flex flex-col">
			<div className="px-4 py-5 sm:p-6 flex-1 flex flex-col min-h-0">
				<div className="flex items-center justify-between mb-4 flex-shrink-0">
					<div>
						<h3 className="text-lg leading-6 font-medium text-gray-900">YAML 配置</h3>
						<p className="mt-1 text-sm text-gray-500">编辑您的用户配置，保存后立即生效</p>
					</div>
					<Button onClick={onToggleHelp} variant="bordered" size="sm" className="lg:hidden">
						字段说明
					</Button>
				</div>

				{/* 验证消息 */}
				<ValidationMessage validationErrors={validationErrors} configPreview={configPreview} />

				{/* YAML 编辑器区域 */}
				<div className="flex-1 min-h-[400px] mb-6">
					<YamlEditor value={configContent} onChange={onConfigContentChange} height="100%" readOnly={false} />
				</div>

				{/* 底部操作区域 */}
				<div className="flex-shrink-0">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center text-sm text-gray-500">
							<svg className="mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							支持 YAML 格式，保存前会自动验证
						</div>
					</div>
					<SubscribeUrlPanel uid={uid} token={token} />
				</div>
			</div>
		</div>
	);
}
