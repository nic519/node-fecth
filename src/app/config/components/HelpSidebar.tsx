import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HelpSidebarProps {
	showHelp: boolean;
	onToggleHelp: () => void;
}

export function HelpSidebar({ showHelp }: HelpSidebarProps) {
	if (!showHelp) return null;

	return (
		<div className="fixed inset-y-0 right-0 z-50 w-full max-w-md lg:relative lg:inset-auto lg:w-80 lg:flex-shrink-0 animate-in slide-in-from-right duration-300 lg:animate-none">
			<Card className="h-full flex flex-col shadow-sm border border-gray-200 bg-white rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                    <h4 className="font-bold text-gray-900">配置字段说明</h4>
                </CardHeader>
				<CardContent className="flex-1 overflow-y-auto p-6 space-y-8 text-sm scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
					<div className="relative">
						<h5 className="font-semibold text-gray-900 mb-4 flex items-center sticky top-0 bg-white py-2 -mt-2 z-10">
							<div className="w-2 h-2 bg-blue-500 rounded-full mr-2 shadow-sm"></div>
							基础配置
						</h5>
						<div className="space-y-4 ml-3 border-l-2 border-gray-100 pl-4">
							<div className="group">
								<div className="flex items-center gap-2 mb-1.5">
									<span className="font-mono bg-blue-50 px-2 py-0.5 rounded text-xs text-blue-700 font-medium border border-blue-100">subscribe</span>
									<Badge variant="destructive" className="h-5 text-[10px] px-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-50">
										*必需
									</Badge>
								</div>
								<p className="text-gray-500 text-xs leading-relaxed">您的节点订阅链接，通常由服务商提供。</p>
							</div>
							<div className="group">
								<div className="flex items-center gap-2 mb-1.5">
									<span className="font-mono bg-blue-50 px-2 py-0.5 rounded text-xs text-blue-700 font-medium border border-blue-100">accessToken</span>
									<Badge variant="destructive" className="h-5 text-[10px] px-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-50">
										*必需
									</Badge>
								</div>
								<p className="text-gray-500 text-xs leading-relaxed">访问令牌，用于身份验证和安全访问。</p>
							</div>
							<div className="group">
								<div className="flex items-center gap-2 mb-1.5">
									<span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 font-medium border border-gray-200">ruleUrl</span>
									<Badge variant="secondary" className="h-5 text-[10px] px-1 bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100">
										可选
									</Badge>
								</div>
								<p className="text-gray-500 text-xs leading-relaxed">自定义规则配置文件的远程链接地址。</p>
							</div>
							<div className="group">
								<div className="flex items-center gap-2 mb-1.5">
									<span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 font-medium border border-gray-200">fileName</span>
									<Badge variant="secondary" className="h-5 text-[10px] px-1 bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100">
										可选
									</Badge>
								</div>
								<p className="text-gray-500 text-xs leading-relaxed">生成配置文件的自定义名称。</p>
							</div>
						</div>
					</div>

					<div className="relative">
						<h5 className="font-semibold text-gray-900 mb-4 flex items-center sticky top-0 bg-white py-2 -mt-2 z-10">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2 shadow-sm"></div>
							高级配置
						</h5>
						<div className="space-y-4 ml-3 border-l-2 border-gray-100 pl-4">
							<div className="group">
								<div className="flex items-center gap-2 mb-1.5">
									<span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 font-medium border border-gray-200">multiPortMode</span>
									<Badge variant="secondary" className="h-5 text-[10px] px-1 bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100">
										可选
									</Badge>
								</div>
								<p className="text-gray-500 text-xs leading-relaxed">
                                    指定需要开启多出口模式的地区代码。例如：
                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 ml-1">TW,HK</code>
                                </p>
							</div>
							<div className="group">
								<div className="flex items-center gap-2 mb-1.5">
									<span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 font-medium border border-gray-200">appendSubList</span>
									<Badge variant="secondary" className="h-5 text-[10px] px-1 bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100">
										可选
									</Badge>
								</div>
								<p className="text-gray-500 text-xs leading-relaxed">
                                    追加额外的订阅源。支持 URL 或对象格式。
                                </p>
								<Card className="bg-amber-50/50 border border-amber-200/60 shadow-none rounded-lg overflow-hidden mt-2">
									<CardContent className="p-3 text-[10px] font-mono text-amber-800/80">
										appendSubList:
										<br />
										&nbsp;&nbsp;- subscribe: "https://..."
										<br />
										&nbsp;&nbsp;&nbsp;&nbsp;flag: "provider1"
										<br />
										&nbsp;&nbsp;&nbsp;&nbsp;includeArea:
										<br />
										&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- TW
										<br />
										&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- HK
									</CardContent>
								</Card>
								<div className="space-y-1.5 pl-1 mt-2">
									<div className="flex items-center gap-2 text-[10px]">
										<span className="font-mono bg-gray-100 px-1 rounded text-gray-600">subscribe</span>
										<span className="text-red-500 font-medium">*必需</span>
										<span className="text-gray-400">- 订阅链接</span>
									</div>
									<div className="flex items-center gap-2 text-[10px]">
										<span className="font-mono bg-gray-100 px-1 rounded text-gray-600">flag</span>
										<span className="text-red-500 font-medium">*必需</span>
										<span className="text-gray-400">- 标识名称</span>
									</div>
									<div className="flex items-center gap-2 text-[10px]">
										<span className="font-mono bg-gray-100 px-1 rounded text-gray-600">includeArea</span>
										<span className="text-gray-400 italic">可选</span>
										<span className="text-gray-400">- 包含地区</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<Card className="bg-amber-50/50 border border-amber-200/60 shadow-none rounded-lg overflow-hidden">
						<CardContent className="p-4">
							<div className="flex gap-3">
								<div className="flex-shrink-0 mt-0.5">
									<svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
										<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
									</svg>
								</div>
								<div>
									<h6 className="text-sm font-semibold text-amber-800 mb-1">提示</h6>
									<p className="text-xs text-amber-700 leading-relaxed">
										所有配置修改后会自动保存。点击右上角的“保存配置”按钮可立即生效并更新订阅。
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</CardContent>
			</Card>
		</div>
	);
}
