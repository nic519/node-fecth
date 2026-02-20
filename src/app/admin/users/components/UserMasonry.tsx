'use client';

import Loading from '@/components/Loading';
import type { UserAdminConfig } from '@/modules/user/admin.schema';
import { UserCard } from './UserCard';

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
		return (
			<div className="flex items-center justify-center py-20 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-border/60 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60">
				<Loading message="正在加载用户数据..." size="md" />
			</div>
		);
	}

	if (users.length === 0 && !error) {
		return (
			<div className="flex flex-col items-center justify-center py-20 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-border/60 shadow-sm text-muted-foreground backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60">
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
