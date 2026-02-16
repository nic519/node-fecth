import { NextRequest, NextResponse } from 'next/server';
import { SuperAdminManager } from '@/module/userManager/superAdminManager';

export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');
  
  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const manager = new SuperAdminManager(env);
    const stats = await manager.getSystemStats();
    
    // 补充 dashboard 需要的数据
    const dashboardStats = {
      ...stats,
      todayRequests: 0, // 暂时 mock
      systemStatus: 'healthy',
      totalTraffic: '0 MB', // 暂时 mock
      todayTraffic: '0 MB', // 暂时 mock
      serverNodes: 1,
      uptime: '0h 0m',
      timestamp: Date.now(),
    };

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: dashboardStats
    });
  } catch (error) {
    return NextResponse.json({ code: 500, msg: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
