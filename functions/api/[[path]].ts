import { Router } from '@/routes/routesHandler';
import { initGlobalConfig } from '@/config/global-config';

// Pages Functions 入口 - 处理所有 /api/* 路由
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  console.log('📄 Pages Functions 处理 API 请求:', request.url);
  initGlobalConfig(request, env);

  const router = new Router();
  return router.route(request, env);
}; 