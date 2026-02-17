import { IUserConfig } from "./user.schema";

export interface SubscriptionStat {
	url: string;
	type: 'main' | 'append';
	name?: string; // For appendSubList flag
	traffic?: string; // Raw traffic string from DB
	lastUpdated?: string; // From dynamic table
}

export type UserAdminConfig = IUserConfig & {
	uid: string;
	updatedAt: string;
	subscriptionStats?: SubscriptionStat[];
};

export interface AdminOperation {
	[key: string]: unknown;
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
