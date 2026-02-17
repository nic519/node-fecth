'use client';

import Loading from '@/components/Loading';
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from '../utils/userUtils';
import { UserActions } from './UserActions';
import { Button } from '@/components/ui/button';
import {
	User,
	Link as LinkIcon,
	Activity,
	Calendar,
	Eye,
} from 'lucide-react';

export interface UserMasonryProps {
	users: UserAdminConfig[];
	loading: boolean;
	error: string | null;
	onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

/**
 * 用户瀑布流组件 - 使用CSS Columns实现
 */
export function UserMasonry({ users, loading, error, onUserAction }: UserMasonryProps) {
	if (loading) {
		return (
			<div className="flex items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
				<Loading message="正在加载用户数据..." size="md" />
			</div>
		);
	}

	if (users.length === 0 && !error) {
		return (
			<div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-500">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-300 mb-3">
					<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
				</svg>
				<span>暂无用户数据</span>
			</div>
		);
	}

	return (
		<div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
			{users.map((user) => (
				<div
					key={user.uid}
					className="break-inside-avoid bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200"
				>
					{/* Header: User Info - Clickable */}
					<div
						className="flex items-start justify-between mb-4 group cursor-pointer"
						onClick={() => onUserAction('view', user.uid, user.accessToken)}
					>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
								<User className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<div className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{user.uid}</div>
							</div>
						</div>
					</div>

					{/* Body: Stats */}
					<div className="space-y-3 mb-5">
						<div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
							<Activity className="h-4 w-4 text-gray-400" />
							<span>流量使用情况</span>
						</div>

						{user.subscriptionStats && user.subscriptionStats.length > 0 ? (
							<div className="space-y-2.5">
								{user.subscriptionStats.map((stat, idx) => (
									<div key={idx} className="bg-gray-50 rounded-lg p-3 text-xs border border-gray-100">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2 overflow-hidden">
												<Badge variant={stat.type === 'main' ? 'default' : 'secondary'} className="h-5 px-1.5 text-[10px] shrink-0">
													{stat.name || (stat.type === 'main' ? '主' : '附')}
												</Badge>
												<span className="text-gray-600 truncate font-mono" title={stat.url}>
													{stat.url}
												</span>
											</div>
										</div>
										<div className="flex justify-between items-center text-gray-600 border-t border-gray-100 pt-2 mt-1">
											<span className="flex items-center gap-1">
												<span className="text-gray-400">已用:</span>
												{stat.traffic ? (
													<span className="font-mono font-medium text-gray-900">{stat.traffic}</span>
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
							<div className="text-sm text-gray-400 italic py-2 bg-gray-50 rounded-lg text-center border border-dashed border-gray-200">
								暂无订阅数据
							</div>
						)}
					</div>

					{/* Footer: Date & Actions */}
					<div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
						<div className="flex items-center gap-1.5 text-xs text-gray-400" title="最后修改时间">
							<Calendar className="h-3.5 w-3.5 flex-shrink-0" />
							<span>{user.updatedAt ? formatDateTime(user.updatedAt) : '-'}</span>
						</div>

						<UserActions
							uid={user.uid}
							token={user.accessToken}
							onUserAction={onUserAction}
						/>
					</div>
				</div>
			))}
		</div>
	);
}
