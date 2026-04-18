import { CORS_HEADERS } from '@/config/cors';
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api') && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
