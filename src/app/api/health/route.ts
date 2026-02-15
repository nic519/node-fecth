import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    code: 0,
    msg: 'success',
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      version: '1.0.0'
    }
  });
}
