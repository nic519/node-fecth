/**
 * 路由系统统一入口
 *
 * 🚀 现代化模块架构 - 不保留向后兼容
 *
 * 架构特点：
 * - 模块化路由系统
 * - 类型安全的 OpenAPI 规范
 * - 统一的中间件管理
 * - 可扩展的路由注册器
 * - 简洁的使用接口
 */

// === 核心路由系统 ===
export { Router } from '@/routes/routesHandler';

// === 模块化架构 ===
export { MiddlewareManager } from '@/routes/middleware';
export { RouteRegistry } from '@/routes/modules/RouteRegistry';

// === 路由模块 ===
export { AdminModule, BaseRouteModule, HealthModule, StorageModule, SubscriptionModule, UserModule } from '@/routes/modules';
export type { IRouteModule } from '@/routes/modules';

// === OpenAPI 规范 ===
export { HealthStatusSchema, MyRouter as ROUTE_PATHS, SuperAdminTokenParamSchema, UserTokenParamSchema } from '@/routes/openapi';

// === 使用示例 ===
/**
 * @example
 * ```typescript
 * import { Router, RouteRegistry } from '@/routes';
 *
 * // 创建路由实例
 * const router = new Router();
 *
 * // 获取注册器实例
 * const registry = router.getRouteRegistry();
 *
 * // 添加自定义模块
 * registry.addModule(new MyCustomModule());
 * ```
 */
