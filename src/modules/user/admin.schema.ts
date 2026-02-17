import { IUserConfig } from "./user.schema";

export type UserAdminConfig = IUserConfig & {
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
	template: Partial<IUserConfig>;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
	usageCount: number;
}
