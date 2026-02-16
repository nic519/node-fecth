/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseCRUD } from '@/db/base-crud';
import { ResponseCodes } from '@/types/openapi-schemas';

/**
 * 数据转换器
 */
export interface DataTransformer<T, TOutput = T> {
	/** 从数据库到 API 的转换（用于 get/list） */
	toApi?: (dbData: T) => TOutput;
	/** 从 API 到数据库的转换（用于 create/update） */
	fromApi?: (apiData: any) => Partial<T>;
}

/**
 * CRUD 操作钩子
 */
export interface CRUDHooks {
	/** 在所有操作前执行（用于统一的身份验证等） */
	beforeEach?: (c: any) => Promise<void | Response>;
	/** 在所有操作后执行（用于统一的后处理） */
	afterEach?: (c: any, result: any) => Promise<any>;
	/** 在 list 操作前执行 */
	beforeList?: (c: any) => Promise<void | Response>;
	/** 在 get 操作前执行 */
	beforeGet?: (c: any) => Promise<void | Response>;
	/** 在 create 操作前执行 */
	beforeCreate?: (c: any) => Promise<void | Response>;
	/** 在 update 操作前执行 */
	beforeUpdate?: (c: any) => Promise<void | Response>;
	/** 在 delete 操作前执行 */
	beforeDelete?: (c: any) => Promise<void | Response>;
}

/**
 * CRUD 操作配置
 */
export interface CRUDConfig<T extends { id: string; createdAt: string; updatedAt: string }, TOutput = T> {
	/** Drizzle 表 schema */
	table: any;
	/** 资源名称（用于消息提示） */
	resourceName: string;
	/** ID 参数名称，默认 'id' */
	idParamName?: string;
	/** ID 参数来源：'path' 从路径参数获取，'query' 从查询参数获取，默认 'path' */
	idParamSource?: 'path' | 'query';
	/** list 操作返回数据的 key（如 templates、users），默认为复数形式 */
	dataKey?: string;
	/** 自定义消息 */
	messages?: Partial<CRUDMessages>;
	/** 数据转换器 */
	transformer?: DataTransformer<T, TOutput>;
	/** CRUD 操作钩子 */
	hooks?: CRUDHooks;
}

/**
 * CRUD 操作消息
 */
export interface CRUDMessages {
	list: string;
	create: string;
	update: string;
	delete: string;
}

/**
 * CRUD 处理器集合
 */
export interface CRUDHandlers {
	list: (c: any) => Promise<any>;
	get: (c: any) => Promise<any>;
	create: (c: any) => Promise<any>;
	update: (c: any) => Promise<any>;
	delete: (c: any) => Promise<any>;
}

/**
 * 创建标准 CRUD 路由处理器
 *
 * @example
 * ```typescript
 * const handlers = createCRUDHandlers<Template>({
 *   table: templates,
 *   resourceName: '模板',
 *   idParamName: 'templateId',
 *   dataKey: 'templates',
 * });
 *
 * app.openapi(listRoute, handlers.list);        // GET /templates
 * app.openapi(getRoute, handlers.get);          // GET /templates/:id
 * app.openapi(createRoute, handlers.create);    // POST /templates
 * app.openapi(updateRoute, handlers.update);    // PUT /templates/:id
 * app.openapi(deleteRoute, handlers.delete);    // DELETE /templates/:id
 * ```
 */
export function createCRUDHandlers<T extends { id: string; createdAt: string; updatedAt: string }, TOutput = T>(
	config: CRUDConfig<T, TOutput>
): CRUDHandlers {
	const { table, resourceName, idParamName = 'id', idParamSource = 'path', dataKey, messages, transformer, hooks } = config;

	/**
	 * 获取 ID 参数（支持从路径参数或查询参数获取）
	 */
	const getId = (c: any): string => {
		if (idParamSource === 'query') {
			return c.req.query(idParamName);
		}
		return c.req.param(idParamName);
	};

	/**
	 * 执行钩子，如果钩子返回 Response 则直接返回
	 */
	const runHook = async (hookFn: ((c: any) => Promise<void | Response>) | undefined, c: any): Promise<Response | null> => {
		if (!hookFn) return null;
		const result = await hookFn(c);
		return result instanceof Response ? result : null;
	};

	// 默认消息
	const defaultMessages: CRUDMessages = {
		list: `获取${resourceName}列表成功`,
		create: `${resourceName}创建成功`,
		update: `${resourceName}更新成功`,
		delete: `${resourceName}删除成功`,
	};

	const finalMessages = { ...defaultMessages, ...messages };

	/**
	 * 📋 List - 获取所有记录
	 */
	const list = async (c: any) => {
		try {
			// 执行钩子
			const beforeEachResult = await runHook(hooks?.beforeEach, c);
			if (beforeEachResult) return beforeEachResult;

			const beforeListResult = await runHook(hooks?.beforeList, c);
			if (beforeListResult) return beforeListResult;

			const crud = new BaseCRUD<T>(c.env as Env, table);
			const result = await crud.select();

			// 应用数据转换器
			const transformedResult = transformer?.toApi ? result.map((item) => transformer.toApi!(item)) : result;

			// 如果指定了 dataKey，则使用该 key 包装结果
			const data = dataKey ? { [dataKey]: transformedResult } : transformedResult;

			return c.json({
				code: ResponseCodes.SUCCESS,
				msg: finalMessages.list,
				data,
			});
		} catch (error) {
			console.error(`❌ ${resourceName} - 获取列表失败:`, error);
			return c.json(
				{
					code: ResponseCodes.INTERNAL_ERROR,
					msg: error instanceof Error ? error.message : `获取${resourceName}列表失败`,
				},
				500
			) as any;
		}
	};

	/**
	 * 🔍 Get - 根据ID获取单个记录
	 */
	const get = async (c: any) => {
		try {
			// 执行钩子
			const beforeEachResult = await runHook(hooks?.beforeEach, c);
			if (beforeEachResult) return beforeEachResult;

			const beforeGetResult = await runHook(hooks?.beforeGet, c);
			if (beforeGetResult) return beforeGetResult;

			const id = getId(c);
			const crud = new BaseCRUD<T>(c.env as Env, table);
			const result = await crud.selectById(id);

			if (!result) {
				return c.json(
					{
						code: ResponseCodes.NOT_FOUND,
						msg: `${resourceName}不存在`,
					},
					404
				) as any;
			}

			// 应用数据转换器
			const transformedResult = transformer?.toApi ? transformer.toApi(result) : result;

			return c.json({
				code: ResponseCodes.SUCCESS,
				msg: `获取${resourceName}成功`,
				data: transformedResult,
			});
		} catch (error) {
			console.error(`❌ ${resourceName} - 获取详情失败:`, error);
			return c.json(
				{
					code: ResponseCodes.INTERNAL_ERROR,
					msg: error instanceof Error ? error.message : `获取${resourceName}详情失败`,
				},
				500
			) as any;
		}
	};

	/**
	 * 🆕 Create - 创建新记录
	 */
	const create = async (c: any) => {
		try {
			// 执行钩子
			const beforeEachResult = await runHook(hooks?.beforeEach, c);
			if (beforeEachResult) return beforeEachResult;

			const beforeCreateResult = await runHook(hooks?.beforeCreate, c);
			if (beforeCreateResult) return beforeCreateResult;

			const body = c.req.valid('json');
			const crud = new BaseCRUD<T>(c.env as Env, table);

			// 应用数据转换器（API -> DB）
			const dbData = transformer?.fromApi ? transformer.fromApi(body) : body;
			const created = await crud.insert(dbData as any);

			// 应用数据转换器（DB -> API）
			const transformedResult = transformer?.toApi ? transformer.toApi(created) : created;

			return c.json({
				code: ResponseCodes.SUCCESS,
				msg: finalMessages.create,
				data: transformedResult,
			});
		} catch (error) {
			console.error(`❌ ${resourceName} - 创建失败:`, error);
			return c.json(
				{
					code: ResponseCodes.INTERNAL_ERROR,
					msg: error instanceof Error ? error.message : `创建${resourceName}失败`,
				},
				500
			) as any;
		}
	};

	/**
	 * ✏️ Update - 更新记录
	 */
	const update = async (c: any) => {
		try {
			// 执行钩子
			const beforeEachResult = await runHook(hooks?.beforeEach, c);
			if (beforeEachResult) return beforeEachResult;

			const beforeUpdateResult = await runHook(hooks?.beforeUpdate, c);
			if (beforeUpdateResult) return beforeUpdateResult;

			const id = getId(c);
			const body = c.req.valid('json');
			const crud = new BaseCRUD<T>(c.env as Env, table);

			// 应用数据转换器（API -> DB）
			const dbData = transformer?.fromApi ? transformer.fromApi(body) : body;
			const updated = await crud.update(id, dbData as any);

			// 应用数据转换器（DB -> API）
			const transformedResult = transformer?.toApi ? transformer.toApi(updated) : updated;

			return c.json({
				code: ResponseCodes.SUCCESS,
				msg: finalMessages.update,
				data: transformedResult,
			});
		} catch (error) {
			// 特殊处理 404
			if (error instanceof Error && error.message === '记录不存在') {
				return c.json(
					{
						code: ResponseCodes.NOT_FOUND,
						msg: `${resourceName}不存在`,
					},
					404
				) as any;
			}

			console.error(`❌ ${resourceName} - 更新失败:`, error);
			return c.json(
				{
					code: ResponseCodes.INTERNAL_ERROR,
					msg: error instanceof Error ? error.message : `更新${resourceName}失败`,
				},
				500
			) as any;
		}
	};

	/**
	 * 🗑️ Delete - 删除记录
	 */
	const deleteHandler = async (c: any) => {
		try {
			// 执行钩子
			const beforeEachResult = await runHook(hooks?.beforeEach, c);
			if (beforeEachResult) return beforeEachResult;

			const beforeDeleteResult = await runHook(hooks?.beforeDelete, c);
			if (beforeDeleteResult) return beforeDeleteResult;

			const id = getId(c);
			const crud = new BaseCRUD<T>(c.env as Env, table);

			await crud.delete(id);

			return c.json({
				code: ResponseCodes.SUCCESS,
				msg: finalMessages.delete,
				data: { [idParamName]: id },
			});
		} catch (error) {
			// 特殊处理 404
			if (error instanceof Error && error.message === '记录不存在') {
				return c.json(
					{
						code: ResponseCodes.NOT_FOUND,
						msg: `${resourceName}不存在`,
					},
					404
				) as any;
			}

			console.error(`❌ ${resourceName} - 删除失败:`, error);
			return c.json(
				{
					code: ResponseCodes.INTERNAL_ERROR,
					msg: error instanceof Error ? error.message : `删除${resourceName}失败`,
				},
				500
			) as any;
		}
	};

	return {
		list,
		get,
		create,
		update,
		delete: deleteHandler,
	};
}
