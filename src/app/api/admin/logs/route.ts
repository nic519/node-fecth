
import { createLogService } from '@/services/log-service';
import { LogLevel } from '@/types/log';
import { ResponseUtils } from '@/utils/responseUtils';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;
  const searchParams = request.nextUrl.searchParams;
  const superToken = searchParams.get('superToken');

  if (!superToken || superToken !== env.SUPER_ADMIN_TOKEN) {
    return NextResponse.json({ code: 401, msg: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logger = createLogService(env);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const level = searchParams.get('level') as LogLevel | undefined;
    const type = searchParams.get('type') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const startTimeStr = searchParams.get('startTime');
    const endTimeStr = searchParams.get('endTime');

    const result = await logger.queryLogs({
      limit: pageSize,
      offset: (page - 1) * pageSize,
      level,
      type,
      userId,
      startTime: startTimeStr ? new Date(startTimeStr) : undefined,
      endTime: endTimeStr ? new Date(endTimeStr) : undefined,
    });

    return NextResponse.json({
      code: 0,
      msg: 'success',
      data: result
    });
  } catch (error: unknown) {
    return ResponseUtils.handleApiError(error);
  }
}
