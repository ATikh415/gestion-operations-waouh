// app/api/health/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ton instance Prisma

export async function GET() {
  try {
    // Test de connexion à la DB
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ 
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      prisma: '7.2.0'
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}