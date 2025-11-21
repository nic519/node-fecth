import {
	ScSuperAdminTokenParams,
	ScUserAdminUpdateReq,
	ScUserAdminUpdateResponse,
	ScUserCreateReq,
	ScUserCreateResponse,
	ScUserDeleteResponse,
	ScUserGetResponse,
	ScUserIdParams,
	ScUserListResponse,
} from '@/routes/modules/user/schema.user';
import { createRoute } from '@hono/zod-openapi';

// =============================================================================
// 管理员用户管理路由
// =============================================================================

const API_PREFIX = '/api/admin/users';

// 获取所有用户列表
export const RUsersList = createRoute({
	method: 'get',
	path: `${API_PREFIX}`,
	operationId: 'adminGetUsers',
	summary: '获取所有用户列表',
	description: '获取系统中所有用户的摘要信息（需要超级管理员权限）',
	tags: ['管理员'],
	request: {
		query: ScSuperAdminTokenParams,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ScUserListResponse,
				},
			},
			description: '成功返回用户列表',
		},
	},
});

// 创建新用户
export const RUserCreate = createRoute({
	method: 'post',
	path: `${API_PREFIX}`,
	operationId: 'adminUserCreate',
	summary: '创建新用户',
	description: '创建新用户配置（需要超级管理员权限）',
	tags: ['管理员'],
	request: {
		query: ScSuperAdminTokenParams,
		body: {
			content: {
				'application/json': {
					schema: ScUserCreateReq,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ScUserCreateResponse,
				},
			},
			description: '成功创建用户',
		},
	},
});

// 更新用户配置
export const RUserUpdate = createRoute({
	method: 'put',
	path: `${API_PREFIX}/{uid}`,
	operationId: 'adminUserUpdate',
	summary: '更新用户配置',
	description: '管理员更新指定用户的配置（需要超级管理员权限）',
	tags: ['管理员'],
	request: {
		params: ScUserIdParams,
		query: ScSuperAdminTokenParams,
		body: {
			content: {
				'application/json': {
					schema: ScUserAdminUpdateReq,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ScUserAdminUpdateResponse,
				},
			},
			description: '成功更新用户',
		},
	},
});

// 删除用户
export const RUserDelete = createRoute({
	method: 'delete',
	path: `${API_PREFIX}/{uid}`,
	operationId: 'adminDeleteUser',
	summary: '删除用户',
	description: '管理员删除指定用户及其所有数据（需要超级管理员权限）',
	tags: ['管理员'],
	request: {
		params: ScUserIdParams,
		query: ScSuperAdminTokenParams,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ScUserDeleteResponse,
				},
			},
			description: '成功删除用户',
		},
		404: {
			description: '用户不存在',
		},
	},
});

// 获取单个用户详情
export const RUserGet = createRoute({
	method: 'get',
	path: `${API_PREFIX}/{uid}`,
	operationId: 'adminGetUser',
	summary: '获取用户详情',
	description: '管理员获取指定用户的详细信息（需要超级管理员权限）',
	tags: ['管理员'],
	request: {
		params: ScUserIdParams,
		query: ScSuperAdminTokenParams,
	},
	responses: {
		200: {
			content: {
				'application/json': {
					schema: ScUserGetResponse,
				},
			},
			description: '成功获取用户详情',
		},
		404: {
			description: '用户不存在',
		},
	},
});
