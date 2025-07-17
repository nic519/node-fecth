import { JSX } from 'preact';
import { ValidationMessage } from './ValidationMessage';
import { SubscribeUrlPanel } from './SubscribeUrlPanel';

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
	const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Tab') {
			e.preventDefault();
			const textarea = e.target as HTMLTextAreaElement;
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			
			// 插入2个空格（YAML标准缩进）
			const indent = '  ';
			const newValue = configContent.substring(0, start) + indent + configContent.substring(end);
			
			onConfigContentChange(newValue);
			
			// 设置光标位置
			setTimeout(() => {
				textarea.selectionStart = textarea.selectionEnd = start + indent.length;
			}, 0);
		}
	};

	return (
		<div className="bg-white shadow rounded-lg w-full flex flex-col">
			<div className="px-4 py-5 sm:p-6 flex-1 flex flex-col min-h-0">
				<div className="flex items-center justify-between mb-4 flex-shrink-0">
					<div>
						<h3 className="text-lg leading-6 font-medium text-gray-900">YAML 配置</h3>
						<p className="mt-1 text-sm text-gray-500">编辑您的用户配置，保存后立即生效</p>
					</div>
					<button
						onClick={onToggleHelp}
						className="lg:hidden inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						<svg
							className="h-4 w-4 mr-2"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						字段说明
					</button>
				</div>

				{/* 验证消息 */}
				<ValidationMessage validationErrors={validationErrors} configPreview={configPreview} />

				{/* 文本编辑区域 */}
				<div className="flex-1 flex flex-col min-h-0 mb-6">
					<textarea
						value={configContent}
						onChange={(e) => onConfigContentChange((e.target as HTMLTextAreaElement).value)}
						onKeyDown={handleKeyDown}
						className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono resize-none min-h-[300px] px-1 py-2"
						placeholder="YAML 配置将在这里显示..."
						spellcheck={false}
					/>
				</div>

				{/* 底部操作区域 */}
				<div className="flex-shrink-0">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center text-sm text-gray-500">
							<svg
								className="mr-1.5 h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
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