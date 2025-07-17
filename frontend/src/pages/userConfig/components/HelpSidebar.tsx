interface HelpSidebarProps {
	showHelp: boolean;
	onToggleHelp: () => void;
}

export function HelpSidebar({ showHelp, onToggleHelp }: HelpSidebarProps) {
	if (!showHelp) return null;

	return (
		<div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl lg:relative lg:inset-auto lg:w-80 lg:flex-shrink-0 lg:shadow-md lg:rounded-lg animate-in slide-in-from-right duration-300 lg:animate-none">
			<div className="h-full flex flex-col">
				<div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
					<h4 className="text-lg font-medium text-gray-900">配置字段说明</h4>
					<button
						onClick={onToggleHelp}
						className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
					<div>
						<h5 className="font-medium text-gray-800 mb-3 flex items-center sticky top-0 bg-white py-2 -mt-2">
							<div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
							基础配置
						</h5>
						<div className="space-y-3 ml-4">
							<div className="border-l-2 border-blue-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">subscribe</span>
									<span className="text-xs text-red-600 font-medium">*必需</span>
								</div>
								<p className="text-gray-600 text-xs">订阅地址 - 您的节点订阅链接</p>
							</div>
							<div className="border-l-2 border-blue-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-blue-50 px-2 py-1 rounded text-xs text-blue-700">accessToken</span>
									<span className="text-xs text-red-600 font-medium">*必需</span>
								</div>
								<p className="text-gray-600 text-xs">访问令牌 - 用于身份验证</p>
							</div>
							<div className="border-l-2 border-gray-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">ruleUrl</span>
									<span className="text-xs text-gray-500">可选</span>
								</div>
								<p className="text-gray-600 text-xs">规则模板链接 - 自定义规则配置文件地址</p>
							</div>
							<div className="border-l-2 border-gray-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">fileName</span>
									<span className="text-xs text-gray-500">可选</span>
								</div>
								<p className="text-gray-600 text-xs">文件名 - 生成配置文件的名称</p>
							</div>
						</div>
					</div>

					<div>
						<h5 className="font-medium text-gray-800 mb-3 flex items-center sticky top-0 bg-white py-2 -mt-2">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
							高级配置
						</h5>
						<div className="space-y-3 ml-4">
							<div className="border-l-2 border-gray-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">multiPortMode</span>
									<span className="text-xs text-gray-500">可选</span>
								</div>
								<p className="text-gray-600 text-xs mb-2">多出口模式 - 指定需要多出口的地区</p>
								<div className="bg-gray-50 p-2 rounded text-xs">
									<p className="text-gray-500 mb-1">支持的地区代码：</p>
									<div className="grid grid-cols-2 gap-1 text-xs">
										<span>TW (台湾)</span>
										<span>SG (新加坡)</span>
										<span>JP (日本)</span>
										<span>VN (越南)</span>
										<span>HK (香港)</span>
										<span>US (美国)</span>
									</div>
								</div>
								<div className="mt-2 bg-blue-50 p-2 rounded font-mono text-xs text-blue-700">
									multiPortMode:
									<br />
									&nbsp;&nbsp;- TW
									<br />
									&nbsp;&nbsp;- SG
								</div>
							</div>
							<div className="border-l-2 border-gray-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">excludeRegex</span>
									<span className="text-xs text-gray-500">可选</span>
								</div>
								<p className="text-gray-600 text-xs mb-2">排除节点的正则表达式 - 在多端口和多订阅模式下有效</p>
								<div className="bg-blue-50 p-2 rounded font-mono text-xs text-blue-700">
									excludeRegex: "(?i)(测试|trial|expire)"
								</div>
							</div>
						</div>
					</div>

					<div>
						<h5 className="font-medium text-gray-800 mb-3 flex items-center sticky top-0 bg-white py-2 -mt-2">
							<div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
							追加订阅配置
						</h5>
						<div className="space-y-3 ml-4">
							<div className="border-l-2 border-gray-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-gray-50 px-2 py-1 rounded text-xs text-gray-700">appendSubList</span>
									<span className="text-xs text-gray-500">可选</span>
								</div>
								<p className="text-gray-600 text-xs mb-2">追加订阅列表 - 添加额外的订阅源</p>
								<div className="bg-blue-50 p-2 rounded font-mono text-xs text-blue-700">
									appendSubList:
									<br />
									&nbsp;&nbsp;- subscribe: "https://example.com/sub1"
									<br />
									&nbsp;&nbsp;&nbsp;&nbsp;flag: "provider1"
									<br />
									&nbsp;&nbsp;&nbsp;&nbsp;includeArea:
									<br />
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- TW
									<br />
									&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- HK
								</div>
								<div className="mt-2 space-y-1 text-xs">
									<div className="flex items-center gap-2">
										<span className="font-mono bg-gray-100 px-1 rounded">subscribe</span>
										<span className="text-red-600">必需</span>
										<span className="text-gray-600">- 订阅链接</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-mono bg-gray-100 px-1 rounded">flag</span>
										<span className="text-red-600">必需</span>
										<span className="text-gray-600">- 标识名称</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-mono bg-gray-100 px-1 rounded">includeArea</span>
										<span className="text-gray-500">可选</span>
										<span className="text-gray-600">- 包含的地区</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
						<h5 className="font-medium text-yellow-800 mb-2 text-sm">完整配置示例</h5>
						<div className="bg-yellow-100 p-3 rounded font-mono text-xs text-yellow-700 overflow-x-auto">
							subscribe: "https://example.com/subscribe"
							<br />
							accessToken: "your-token-here"
							<br />
							ruleUrl: "https://example.com/rules.yaml"
							<br />
							fileName: "config.yaml"
							<br />
							multiPortMode:
							<br />
							&nbsp;&nbsp;- TW
							<br />
							&nbsp;&nbsp;- HK
							<br />
							excludeRegex: "(?i)(test|trial)"
							<br />
							appendSubList:
							<br />
							&nbsp;&nbsp;- subscribe: "https://sub1.example.com"
							<br />
							&nbsp;&nbsp;&nbsp;&nbsp;flag: "backup"
							<br />
							&nbsp;&nbsp;&nbsp;&nbsp;includeArea:
							<br />
							&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- SG
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 