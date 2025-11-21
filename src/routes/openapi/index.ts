// =============================================================================
// OpenAPI 路由模块化入口文件
// =============================================================================

// 导出公共常量和 schemas
export * from './common';

// 导出健康检查路由
export * from './health';

// 导出用户配置路由
export * from '../modules/user/method.user';

// 导出订阅路由
export * from '../modules/proxy/method.proxy';

// 导出管理员用户路由
export * from '../modules/user/method.user-for-admin';

// 导出管理员模板路由
export * from '../modules/template/method.admin-template';
