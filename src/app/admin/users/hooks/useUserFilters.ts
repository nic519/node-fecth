'use client';

import { UserAdminConfig } from '@/modules/user/admin.schema';
import { useMemo, useState } from 'react';
import { compareUsers, matchUserScope, type UserScope, type UserSort } from '../utils/userUtils';

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
}

/**
 * 用户过滤Hook - 处理搜索、状态范围筛选和排序
 */
export const useUserFilters = ({ users }: UseUserFiltersProps): UseUserFiltersReturn => {
	const [searchTerm, setSearchTerm] = useState('');
	const [scope, setScope] = useState<UserScope>('all');
	const [sort, setSort] = useState<UserSort>('attention');

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

		return [...filtered].sort(compareUsers(sort));
	}, [users, searchTerm, scope, sort]);

	return {
		filteredUsers,
		searchTerm,
		setSearchTerm,
		scope,
		setScope,
		sort,
		setSort,
	};
};
