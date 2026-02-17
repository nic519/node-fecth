'use client';

import Loading from '@/components/Loading';
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from '../utils/userUtils';
import { UserActions } from './UserActions';
import { cn } from '@/lib/utils';

export interface UserTableProps {
	users: UserAdminConfig[];
	loading: boolean;
	error: string | null;
	onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

/**
 * 用户表格组件 - 展示用户列表和相关信息
 */
export function UserTable({ users, loading, error, onUserAction }: UserTableProps) {
	return (
		<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
			<div className="overflow-x-auto">
				<Table>
					<TableHeader className="bg-gray-50">
						<TableRow>
							<TableHead className="w-[250px] font-medium text-xs uppercase tracking-wider h-12 text-gray-500">用户ID / 订阅链接</TableHead>
							<TableHead className="font-medium text-xs uppercase tracking-wider h-12 text-gray-500">配置状态</TableHead>
							<TableHead className="font-medium text-xs uppercase tracking-wider h-12 text-gray-500">流量使用情况</TableHead>
							<TableHead className="font-medium text-xs uppercase tracking-wider h-12 text-gray-500">最后修改</TableHead>
							<TableHead className="font-medium text-xs uppercase tracking-wider h-12 text-gray-500 text-right">操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={4} className="h-24 text-center">
									<Loading message="正在加载用户数据..." size="sm" />
								</TableCell>
							</TableRow>
						) : users.length === 0 && !error ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center py-12 text-gray-500">
									<div className="flex flex-col items-center justify-center">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-3">
											<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
										</svg>
										<span>暂无用户数据</span>
									</div>
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.uid} className="hover:bg-gray-50 transition-colors">
									<TableCell>
										<div className="flex flex-col">
											<div className="font-semibold text-gray-900">{user.uid}</div>
											{user.subscribe && (
												<div className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5 font-mono" title={user.subscribe}>
													{user.subscribe}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={'outline'}
											className={cn(
												"h-6 px-2 font-medium border-transparent bg-green-100 text-green-700 hover:bg-green-100"
											)}
										>
											<span className={`w-1.5 h-1.5 rounded-full mr-1.5 bg-green-500`}></span>
											已配置
										</Badge>
									</TableCell>
									<TableCell>
										{user.subscriptionStats && user.subscriptionStats.length > 0 ? (
											<div className="space-y-2 max-w-[300px]">
												{user.subscriptionStats.map((stat, idx) => (
													<div key={idx} className="bg-gray-50 rounded p-2 text-xs border border-gray-100">
														<div className="flex items-center gap-1.5 mb-1.5">
															<Badge variant={stat.type === 'main' ? 'default' : 'secondary'} className="h-4 px-1 text-[10px]">
																{stat.name || (stat.type === 'main' ? '主' : '附')}
															</Badge>
															<span className="text-gray-500 truncate" title={stat.url}>
																{stat.url}
															</span>
														</div>
														<div className="flex justify-between items-center text-gray-600">
															<span>
																{stat.traffic ? (
																	<span className="font-mono font-medium">{stat.traffic}</span>
																) : (
																	<span className="text-gray-400">无数据</span>
																)}
															</span>
															<span className="text-[10px] text-gray-400">
																{stat.lastUpdated ? new Date(stat.lastUpdated).toLocaleDateString() : ''}
															</span>
														</div>
													</div>
												))}
											</div>
										) : (
											<span className="text-xs text-gray-400">无订阅数据</span>
										)}
									</TableCell>
									<TableCell>
										<div className="text-xs text-gray-500">
											{user.updatedAt ? formatDateTime(user.updatedAt) : '-'}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<UserActions
											uid={user.uid}
											token={user.accessToken}
											onUserAction={onUserAction}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
