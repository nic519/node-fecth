'use client';

import { UserAdminConfig } from '@/modules/user/admin.schema';
import { useMemo, useState } from 'react';

export interface UseUserFiltersProps {
	users: UserAdminConfig[];
}

export interface UseUserFiltersReturn {
	filteredUsers: UserAdminConfig[];
	searchTerm: string;
	statusFilter: string;
	setSearchTerm: (term: string) => void;
	setStatusFilter: (filter: string) => void;
}

/**
 * 用户过滤Hook - 处理搜索和过滤逻辑
 */
export const useUserFilters = ({ users }: UseUserFiltersProps): UseUserFiltersReturn => {
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('');

	const filteredUsers = useMemo(() => {
		let filtered = users;

		// 根据搜索词过滤
		if (searchTerm) {
			filtered = filtered.filter((user) => user.uid.toLowerCase().includes(searchTerm.toLowerCase()));
		}

		return filtered;
	}, [users, searchTerm, statusFilter]);

	return {
		filteredUsers,
		searchTerm,
		statusFilter,
		setSearchTerm,
		setStatusFilter,
	};
};
