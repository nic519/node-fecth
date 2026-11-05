'use client';

import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { UserCard } from './UserCard';
import { UserMasonrySkeleton } from './UserMasonrySkeleton';

export interface UserMasonryProps {
	users: UserAdminConfig[];
	loading: boolean;
	error: string | null;
	onUserAction: (action: string, uid: string, token?: string) => Promise<void>;
}

/**
 * User Masonry Component - Uses CSS Columns for layout
 */
export function UserMasonry({ users, loading, error, onUserAction }: UserMasonryProps) {
	if (loading) {
		return <UserMasonrySkeleton />;
	}

	if (users.length === 0 && !error) {
		return (
			<div className="surface flex flex-col items-center justify-center py-20 text-muted-foreground">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-12 h-12 text-muted-foreground/50 mb-3"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
					/>
				</svg>
				<span>暂无用户数据</span>
			</div>
		);
	}

	return (
		<div className="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
			{users.map((user) => (
				<UserCard
					key={user.uid}
					user={user}
					onUserAction={onUserAction}
				/>
			))}
		</div>
	);
}
