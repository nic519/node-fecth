import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CORS_HEADERS } from '@/config/cors';

export function middleware(request: NextRequest) {
  // 仅针对 /api 路径应用 CORS
  if (request.nextUrl.pathname.startsWith('/api')) {
    
    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 对于其他请求，让后续的 handler 处理
    // 如果需要全局强制添加 CORS 头，可以在这里处理 response
    // 但目前 ResponseUtils 和 ClashHandler 已经处理了，所以这里暂时只处理 OPTIONS
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
