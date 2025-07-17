import type { UserSummary } from '@/types/user-config';
import { useEffect, useState } from 'preact/hooks';

export interface UseUserFiltersProps {
	users: UserSummary[];
}

export interface UseUserFiltersReturn {
	filteredUsers: UserSummary[];
	searchTerm: string;
	statusFilter: string;
	sourceFilter: string;
	setSearchTerm: (term: string) => void;
	setStatusFilter: (filter: string) => void;
	setSourceFilter: (filter: string) => void;
}

/**
 * 用户过滤Hook - 处理搜索和过滤逻辑
 */
export const useUserFilters = ({ users }: UseUserFiltersProps): UseUserFiltersReturn => {
	const [filteredUsers, setFilteredUsers] = useState<UserSummary[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [sourceFilter, setSourceFilter] = useState('');

	// 当用户列表或过滤条件变化时，重新过滤
	useEffect(() => {
		filterUsers();
	}, [users, searchTerm, statusFilter, sourceFilter]);

	/**
	 * 过滤用户列表
	 */
	const filterUsers = () => {
		let filtered = users;

		// 根据搜索词过滤
		if (searchTerm) {
			filtered = filtered.filter((user) => 
				user.uid.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// 根据配置状态过滤
		if (statusFilter) {
			if (statusFilter === 'configured') {
				filtered = filtered.filter((user) => user.hasConfig);
			} else if (statusFilter === 'unconfigured') {
				filtered = filtered.filter((user) => !user.hasConfig);
			}
		}

		// 根据数据源过滤
		if (sourceFilter) {
			filtered = filtered.filter((user) => user.source === sourceFilter);
		}

		setFilteredUsers(filtered);
	};

	return {
		filteredUsers,
		searchTerm,
		statusFilter,
		sourceFilter,
		setSearchTerm,
		setStatusFilter,
		setSourceFilter,
	};
}; 