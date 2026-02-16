import { UserConfig } from "@/types/openapi-schemas";

export type UserAdminConfig = UserConfig & {
	uid: string;
	updatedAt: string;
};

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