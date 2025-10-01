import { Card, CardHeader, CardBody, Button, Chip } from '@heroui/react';

interface HelpSidebarProps {
	showHelp: boolean;
	onToggleHelp: () => void;
}

export function HelpSidebar({ showHelp, onToggleHelp }: HelpSidebarProps) {
	if (!showHelp) return null;

	return (
		<div className="fixed inset-y-0 right-0 z-50 w-full max-w-md lg:relative lg:inset-auto lg:w-80 lg:flex-shrink-0 animate-in slide-in-from-right duration-300 lg:animate-none">
			<Card className="h-full flex flex-col shadow-xl lg:shadow-md">
				<CardHeader className="flex items-center justify-between p-6 border-b border-divider flex-shrink-0">
					<h4 className="text-lg font-medium">配置字段说明</h4>
					<Button
						onClick={onToggleHelp}
						isIconOnly
						variant="light"
						size="sm"
						className="lg:hidden"
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</Button>
				</CardHeader>

				<CardBody className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
					<div>
						<h5 className="font-medium mb-3 flex items-center sticky top-0 bg-background py-2 -mt-2">
							<div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
							基础配置
						</h5>
						<div className="space-y-3 ml-4">
							<div className="border-l-2 border-primary-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-primary-50 px-2 py-1 rounded text-xs text-primary">subscribe</span>
									<Chip size="sm" color="danger" variant="flat">*必需</Chip>
								</div>
								<p className="text-default-600 text-xs">订阅地址 - 您的节点订阅链接</p>
							</div>
							<div className="border-l-2 border-primary-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-primary-50 px-2 py-1 rounded text-xs text-primary">accessToken</span>
									<Chip size="sm" color="danger" variant="flat">*必需</Chip>
								</div>
								<p className="text-default-600 text-xs">访问令牌 - 用于身份验证</p>
							</div>
							<div className="border-l-2 border-default-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-default-50 px-2 py-1 rounded text-xs">ruleUrl</span>
									<Chip size="sm" color="default" variant="flat">可选</Chip>
								</div>
								<p className="text-default-600 text-xs">规则模板链接 - 自定义规则配置文件地址</p>
							</div>
							<div className="border-l-2 border-default-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-default-50 px-2 py-1 rounded text-xs">fileName</span>
									<Chip size="sm" color="default" variant="flat">可选</Chip>
								</div>
								<p className="text-default-600 text-xs">文件名 - 生成配置文件的名称</p>
							</div>
						</div>
					</div>

					<div>
						<h5 className="font-medium mb-3 flex items-center sticky top-0 bg-background py-2 -mt-2">
							<div className="w-2 h-2 bg-success rounded-full mr-2"></div>
							高级配置
						</h5>
						<div className="space-y-3 ml-4">
							<div className="border-l-2 border-default-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-default-50 px-2 py-1 rounded text-xs">multiPortMode</span>
									<Chip size="sm" color="default" variant="flat">可选</Chip>
								</div>
								<p className="text-default-600 text-xs mb-2">多出口模式 - 指定需要多出口的地区</p>
								<Card className="bg-default-50 p-2 text-xs">
									<p className="text-default-500 mb-1">支持的地区代码：</p>
									<div className="grid grid-cols-2 gap-1 text-xs">
										<span>TW (台湾)</span>
										<span>SG (新加坡)</span>
										<span>JP (日本)</span>
										<span>VN (越南)</span>
										<span>HK (香港)</span>
										<span>US (美国)</span>
									</div>
								</Card>
								<Card className="mt-2 bg-primary-50 p-2">
									<div className="font-mono text-xs text-primary">
										multiPortMode:<br />
										&nbsp;&nbsp;- TW<br />
										&nbsp;&nbsp;- SG
									</div>
								</Card>
							</div>
							<div className="border-l-2 border-default-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-default-50 px-2 py-1 rounded text-xs">excludeRegex</span>
									<Chip size="sm" color="default" variant="flat">可选</Chip>
								</div>
								<p className="text-default-600 text-xs mb-2">排除节点的正则表达式 - 在多端口和多订阅模式下有效</p>
								<Card className="bg-primary-50 p-2">
									<div className="font-mono text-xs text-primary">
										excludeRegex: "(?i)(测试|trial|expire)"
									</div>
								</Card>
							</div>
						</div>
					</div>

					<div>
						<h5 className="font-medium mb-3 flex items-center sticky top-0 bg-background py-2 -mt-2">
							<div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
							追加订阅配置
						</h5>
						<div className="space-y-3 ml-4">
							<div className="border-l-2 border-default-100 pl-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-mono bg-default-50 px-2 py-1 rounded text-xs">appendSubList</span>
									<Chip size="sm" color="default" variant="flat">可选</Chip>
								</div>
								<p className="text-default-600 text-xs mb-2">追加订阅列表 - 添加额外的订阅源</p>
								<Card className="bg-primary-50 p-2 mb-2">
									<div className="font-mono text-xs text-primary overflow-x-auto">
										appendSubList:<br />
										&nbsp;&nbsp;- subscribe: "https://example.com/sub1"<br />
										&nbsp;&nbsp;&nbsp;&nbsp;flag: "provider1"<br />
										&nbsp;&nbsp;&nbsp;&nbsp;includeArea:<br />
										&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- TW<br />
										&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- HK
									</div>
								</Card>
								<div className="space-y-1 text-xs">
									<div className="flex items-center gap-2">
										<span className="font-mono bg-default-100 px-1 rounded">subscribe</span>
										<Chip size="sm" color="danger" variant="flat">必需</Chip>
										<span className="text-default-600">- 订阅链接</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-mono bg-default-100 px-1 rounded">flag</span>
										<Chip size="sm" color="danger" variant="flat">必需</Chip>
										<span className="text-default-600">- 标识名称</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="font-mono bg-default-100 px-1 rounded">includeArea</span>
										<Chip size="sm" color="default" variant="flat">可选</Chip>
										<span className="text-default-600">- 包含的地区</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<Card className="bg-warning-50 border border-warning-200">
						<CardBody className="p-3">
							<h5 className="font-medium text-warning-800 mb-2 text-sm">完整配置示例</h5>
							<div className="bg-warning-100 p-3 rounded font-mono text-xs text-warning-700 overflow-x-auto">
								subscribe: "https://example.com/subscribe"<br />
								accessToken: "your-token-here"<br />
								ruleUrl: "https://example.com/rules.yaml"<br />
								fileName: "config.yaml"<br />
								multiPortMode:<br />
								&nbsp;&nbsp;- TW<br />
								&nbsp;&nbsp;- HK<br />
								excludeRegex: "(?i)(test|trial)"<br />
								appendSubList:<br />
								&nbsp;&nbsp;- subscribe: "https://sub1.example.com"<br />
								&nbsp;&nbsp;&nbsp;&nbsp;flag: "backup"<br />
								&nbsp;&nbsp;&nbsp;&nbsp;includeArea:<br />
								&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- SG
							</div>
						</CardBody>
					</Card>
				</CardBody>
			</Card>
		</div>
	);
} 