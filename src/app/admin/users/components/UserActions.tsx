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
				className="h-10 w-10 rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
