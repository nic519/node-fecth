import { UserConfig } from "@/types/openapi-schemas";

export interface SuperAdminStats {
	totalUsers: number;
	activeUsers: number;
	kvConfigUsers: number;
	envConfigUsers: number;
	configCompleteRate: number;
	todayNewUsers: number;
}

export interface UserSummary {
	userId: string;
	token: string;
	hasConfig: boolean;
	source: 'kv' | 'env' | 'none';
	lastModified: string | null; 
	isActive: boolean;
	subscribeUrl?: string;
	status: 'active' | 'inactive' | 'disabled';
	trafficInfo?: {
		upload: number;
		download: number;
		total: number;
		used: number;
		remaining: number;
		expire?: number;
		isExpired: boolean;
		usagePercent: number;
	};
}

export interface AdminOperation {
	timestamp: string;
	operation: string;
	targetUserId?: string;
	adminId: string;
	result: 'success' | 'error';
	details?: string;
	ipAddress?: string;
}

export interface ConfigTemplate {
	id: string;
	name: string;
	description: string;
	template: Partial<UserConfig>;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
	usageCount: number;
}