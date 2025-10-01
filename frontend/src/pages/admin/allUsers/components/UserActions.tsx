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
				variant="light"
				color="primary"
				onClick={() => onUserAction('view', uid, token)}
			>
				查看
			</Button>
			<Button
				size="sm"
				variant="light"
				color="success"
				onClick={() => onUserAction('refresh', uid)}
			>
				刷新
			</Button>
			<Button
				size="sm"
				variant="light"
				color="danger"
				onClick={() => onUserAction('delete', uid)}
			>
				删除
			</Button>
		</div>
	);
} 