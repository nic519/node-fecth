import { NextResponse } from 'next/server';

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
