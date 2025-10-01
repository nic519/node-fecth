import { Button } from '@heroui/react';

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
		<div className="flex gap-2">
			<Button
				size="sm"
				variant="solid"
				className="bg-blue-600 text-white hover:bg-blue-700"
				onClick={() => onUserAction('view', uid, token)}
			>
				查看
			</Button>
			<Button
				size="sm"
				variant="solid"
				color="success"
				onClick={() => onUserAction('refresh', uid)}
			>
				刷新
			</Button>
			<Button
				size="sm"
				variant="solid"
				color="danger"
				onClick={() => onUserAction('delete', uid)}
			>
				删除
			</Button>
		</div>
	);
} 