'use client';

import { Button } from '@/components/ui/button';

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
		<div className="flex gap-2 justify-end">
			<Button
				size="sm"
				variant="default"
				className="bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
				onClick={() => onUserAction('view', uid, token)}
			>
				查看
			</Button>
			<Button
				size="sm"
				variant="default"
				className="bg-green-600 text-white hover:bg-green-700 whitespace-nowrap"
				onClick={() => onUserAction('refresh', uid)}
			>
				刷新
			</Button>
			<Button
				size="sm"
				variant="destructive"
				className="whitespace-nowrap"
				onClick={() => onUserAction('delete', uid)}
			>
				删除
			</Button>
		</div>
	);
}
