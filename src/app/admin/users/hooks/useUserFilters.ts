'use client';

import type { UserAdminConfig } from '@/modules/user/admin.types';
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

		// 根据配置状态过滤 (暂时移除 hasConfig 过滤，因为所有用户都有配置)
		/*
		if (statusFilter) {
			if (statusFilter === 'configured') {
				filtered = filtered.filter((user) => user.hasConfig);
			} else if (statusFilter === 'unconfigured') {
				filtered = filtered.filter((user) => !user.hasConfig);
			}
		}
		*/

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
