'use client';

import Loading from '@/components/Loading';
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatTraffic, getTrafficBarColor, parseTrafficInfo } from '../utils/userUtils';
import { UserActions } from './UserActions';
import {
	User,
	Activity,
	Calendar,
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
			<div className="flex items-center justify-center py-20 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-border/60 shadow-sm backdrop-blur-sm">
				<Loading message="正在加载用户数据..." size="md" />
			</div>
		);
	}

	if (users.length === 0 && !error) {
		return (
			<div className="flex flex-col items-center justify-center py-20 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-border/60 shadow-sm text-muted-foreground backdrop-blur-sm">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-muted-foreground/50 mb-3">
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
					className="break-inside-avoid bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-sm border border-border/60 p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-300 backdrop-blur-sm"
				>
					{/* Header: User Info - Clickable */}
					<div
						className="flex items-start justify-between mb-4 group cursor-pointer"
						onClick={() => onUserAction('view', user.uid, user.accessToken)}
					>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div>
								<div className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">{user.uid}</div>
							</div>
						</div>
					</div>

					{/* Body: Stats */}
					<div className="space-y-3 mb-5">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
							<Activity className="h-4 w-4 text-muted-foreground/70" />
							<span>流量使用情况</span>
						</div>

						{user.subscriptionStats && user.subscriptionStats.length > 0 ? (
							<div className="space-y-2.5">
								{user.subscriptionStats.map((stat, idx) => (
									<div key={idx} className="bg-muted/30 rounded-lg p-3 text-xs border border-border/40 hover:border-primary/20 transition-colors">
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center gap-2 overflow-hidden">
												<Badge variant={stat.type === 'main' ? 'default' : 'secondary'} className="h-5 px-1.5 text-[10px] shrink-0 font-normal">
													{stat.name || (stat.type === 'main' ? '主' : '附')}
												</Badge>
												<span className="text-muted-foreground truncate font-mono" title={stat.url}>
													{stat.url}
												</span>
											</div>
										</div>
										{(() => {
											const trafficInfo = parseTrafficInfo(stat.traffic || null);
											const usagePercent = trafficInfo ? Math.min(100, Math.max(0, trafficInfo.usagePercent)) : 0;

											return (
												<div className="space-y-1.5 border-t border-border/40 pt-2 mt-1">
													<div className="flex items-center justify-between text-muted-foreground">
														<span className="flex items-center gap-1">

															{trafficInfo ? (
																<span className="font-mono font-medium text-foreground">
																	<span className="text-muted-foreground/70">已用 </span>
																	{formatTraffic(trafficInfo.used)} / {formatTraffic(trafficInfo.total)}
																</span>
															) : stat.lastUpdated ? (stat.traffic ? (
																<span className="font-mono font-medium text-foreground">{stat.traffic}</span>) : (
																<span className="text-muted-foreground/70">无流量数据</span>
															)
															) : (
																<span className="text-muted-foreground/70">无数据</span>
															)}
														</span>
														<span className="text-[10px] text-muted-foreground/70">
															{trafficInfo ? `${trafficInfo.usagePercent.toFixed(1)}%` : ''}
														</span>
													</div>
													{trafficInfo && (
														<div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
															<div
																className={`h-full ${getTrafficBarColor(usagePercent)}`}
																style={{ width: `${usagePercent}%` }}
															/>
														</div>
													)}
													<div className="flex justify-between items-center text-[10px] text-muted-foreground/70">
														<span>
															{trafficInfo && trafficInfo.expire
																? `到期 ${new Date(trafficInfo.expire * 1000).toLocaleDateString()}`
																: ''}
														</span>
														<span>
															{stat.lastUpdated ? <span>⏰ 操作 {new Date(stat.lastUpdated).toLocaleString(

															)}</span> : ''}
														</span>
													</div>
												</div>
											);
										})()}
									</div>
								))}
							</div>
						) : (
							<div className="text-sm text-muted-foreground/60 italic py-2 bg-muted/20 rounded-lg text-center border border-dashed border-border/40">
								暂无订阅数据
							</div>
						)}
					</div>

					{/* Footer: Date & Actions */}
					<div className="pt-4 border-t border-border/40 flex items-center justify-between mt-auto">
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground/70" title="最后修改时间">
							<Calendar className="h-3.5 w-3.5 flex-shrink-0" />
							<span>{user.updatedAt ? formatDateTime(user.updatedAt) : '-'}</span>
						</div>

						<UserActions
							uid={user.uid}
							onUserAction={onUserAction}
						/>
					</div>
				</div>
			))}
		</div>
	);
}
