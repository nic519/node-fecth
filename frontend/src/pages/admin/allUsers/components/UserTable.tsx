import Loading from '@/components/Loading';
import type { UserSummary } from '@/types/user-config';
import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { formatDateTime, formatTraffic, getSourceText, getTrafficBarColor } from '../utils/userUtils';
import { UserActions } from './UserActions';

export interface UserTableProps {
	users: UserSummary[];
	loading: boolean;
	error: string | null;
	onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

/**
 * 用户表格组件 - 展示用户列表和相关信息
 */
export function UserTable({ users, loading, error, onUserAction }: UserTableProps) {
	return (
		<div className="bg-white rounded-lg shadow-sm border overflow-hidden">
			{loading && (
				<div className="px-6 py-2 border-b border-gray-200">
					<Chip size="sm" variant="flat">
						加载中...
					</Chip>
				</div>
			)}
			<div className="overflow-x-auto">
				<Table aria-label="用户列表">
					<TableHeader>
						<TableColumn>用户ID</TableColumn>
						<TableColumn>配置状态</TableColumn>
						<TableColumn>数据源</TableColumn>
						<TableColumn>流量使用</TableColumn>
						<TableColumn>最后修改时间</TableColumn>
						<TableColumn>操作</TableColumn>
					</TableHeader>
					<TableBody isLoading={loading} loadingContent={<Loading message="正在加载用户数据..." size="sm" />}>
						{users.length === 0 && !loading && !error ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-4 text-gray-500">
									暂无用户数据
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
							<TableRow key={user.uid}>
								<TableCell>
									<div>
										<div className="text-sm font-medium text-gray-900">{user.uid}</div>
										{user.subscribeUrl && (
											<div className="text-xs text-gray-500 truncate max-w-32" title={user.subscribeUrl}>
												{user.subscribeUrl}
											</div>
										)}
									</div>
								</TableCell>
								<TableCell>
									<Chip size="sm" color={user.hasConfig ? 'success' : 'danger'} variant="flat">
										{user.hasConfig ? '已配置' : '未配置'}
									</Chip>
								</TableCell>
								<TableCell>
									<Chip size="sm" color="secondary" variant="flat">
										{getSourceText(user.source)}
									</Chip>
								</TableCell>
								<TableCell>
									{user.trafficInfo ? (
										<div className="space-y-1">
											<div className="text-xs">
												{formatTraffic(user.trafficInfo.used)} / {formatTraffic(user.trafficInfo.total)}
											</div>
											<div className="w-20 bg-gray-200 rounded-full h-1.5">
												<div
													className={`h-1.5 rounded-full ${getTrafficBarColor(user.trafficInfo.usagePercent)}`}
													style={{ width: `${Math.min(user.trafficInfo.usagePercent, 100)}%` }}
												/>
											</div>
											<div className="text-xs text-gray-500">{user.trafficInfo.usagePercent.toFixed(1)}%</div>
										</div>
									) : (
										<span className="text-gray-400 text-sm">无数据</span>
									)}
								</TableCell>
								<TableCell>
									<div className="text-sm text-gray-900">{formatDateTime(user.lastModified)}</div>
								</TableCell>
								<TableCell>
									<UserActions uid={user.uid} token={user.token} onUserAction={onUserAction} />
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
