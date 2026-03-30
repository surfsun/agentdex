import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'pong',
    version: '2026-03-30-v1',
    timestamp: new Date().toISOString()
  })
}