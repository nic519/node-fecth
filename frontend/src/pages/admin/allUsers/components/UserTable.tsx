import type { UserSummary } from '@/types/user-config';
import { formatTraffic, formatDateTime, getSourceClass, getSourceText, getTrafficBarColor } from '../utils/userUtils';
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
			<div className="px-6 py-4 border-b border-gray-200">
				<h3 className="text-lg font-semibold text-gray-900">
					用户列表
					{loading && <span className="text-sm text-gray-500 ml-2">加载中...</span>}
				</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户ID</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配置状态</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据源</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">流量使用</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后修改时间</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{loading && users.length === 0 && (
							<tr>
								<td colSpan={6} className="px-6 py-4 text-center text-gray-500">
									正在加载用户数据...
								</td>
							</tr>
						)}

						{!loading && users.length === 0 && !error && (
							<tr>
								<td colSpan={6} className="px-6 py-4 text-center text-gray-500">
									暂无用户数据
								</td>
							</tr>
						)}

						{users.map((user) => (
							<tr key={user.uid} className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm font-medium text-gray-900">{user.uid}</div>
									{user.subscribeUrl && (
										<div className="text-xs text-gray-500 truncate max-w-32" title={user.subscribeUrl}>
											{user.subscribeUrl}
										</div>
									)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
											user.hasConfig ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
										}`}
									>
										{user.hasConfig ? '已配置' : '未配置'}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceClass(user.source)}`}>
										{getSourceText(user.source)}
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
										<span className="text-gray-400">无数据</span>
									)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{formatDateTime(user.lastModified)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<UserActions 
										uid={user.uid} 
										token={user.token} 
										onUserAction={onUserAction} 
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
} 