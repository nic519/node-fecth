'use client';

import { UserAdminConfig } from '@/modules/user/admin.schema';
import { useMemo, useState } from 'react';
import { compareUsers, DEFAULT_USER_SORT_DIR, matchUserScope, type SortDirection, type UserScope, type UserSort } from '../utils/userUtils';

export interface UseUserFiltersProps {
	users: UserAdminConfig[];
}

export interface UseUserFiltersReturn {
	filteredUsers: UserAdminConfig[];
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	scope: UserScope;
	setScope: (scope: UserScope) => void;
	sort: UserSort;
	setSort: (sort: UserSort) => void;
	sortDir: SortDirection;
	toggleSortDir: () => void;
}

/**
 * 用户过滤Hook - 处理搜索、状态范围筛选和排序
 */
export const useUserFilters = ({ users }: UseUserFiltersProps): UseUserFiltersReturn => {
	const [searchTerm, setSearchTerm] = useState('');
	const [scope, setScope] = useState<UserScope>('all');
	const [sort, setSortState] = useState<UserSort>('attention');
	const [sortDir, setSortDir] = useState<SortDirection>(DEFAULT_USER_SORT_DIR.attention);

	// 换排序维度时回到该维度的默认方向，方向按钮只负责翻转当前方向。
	const setSort = (next: UserSort) => {
		setSortState(next);
		setSortDir(DEFAULT_USER_SORT_DIR[next]);
	};
	const toggleSortDir = () => setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));

	const filteredUsers = useMemo(() => {
		let filtered = users.filter((user) => matchUserScope(user, scope));

		// 多维搜索：用户 ID、配置文件名、订阅源标识。
		const term = searchTerm.trim().toLowerCase();
		if (term) {
			filtered = filtered.filter((user) => {
				const haystack = [
					user.uid,
					user.fileName ?? '',
					...(user.subscriptionStats ?? []).map((stat) => stat.name ?? ''),
				].join(' ').toLowerCase();
				return haystack.includes(term);
			});
		}

		return [...filtered].sort(compareUsers(sort, sortDir));
	}, [users, searchTerm, scope, sort, sortDir]);

	return {
		filteredUsers,
		searchTerm,
		setSearchTerm,
		scope,
		setScope,
		sort,
		setSort,
		sortDir,
		toggleSortDir,
	};
};
