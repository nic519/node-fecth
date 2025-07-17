export interface UserActionsProps {
	uid: string;
	token?: string;
	onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

/**
 * 用户操作按钮组件
 */
export function UserActions({ uid, token, onUserAction }: UserActionsProps) {
	return (
		<div className="flex space-x-2">
			<button
				onClick={() => onUserAction('view', uid, token)}
				className="text-indigo-600 hover:text-indigo-900"
			>
				查看
			</button>
			<button 
				onClick={() => onUserAction('refresh', uid)} 
				className="text-green-600 hover:text-green-900"
			>
				刷新
			</button>
			<button 
				onClick={() => onUserAction('delete', uid)} 
				className="text-red-600 hover:text-red-900"
			>
				删除
			</button>
		</div>
	);
} 