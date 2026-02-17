'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export interface UserActionsProps {
	uid: string;
	onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

/**
 * 用户操作按钮组件
 */
export function UserActions({ uid, onUserAction }: UserActionsProps) {
	return (
		<div className="flex justify-end">
			<Button
				size="icon"
				variant="ghost"
				className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
				onClick={(e) => {
					e.stopPropagation();
					onUserAction('delete', uid);
				}}
				title="删除用户"
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</div>
	);
}
