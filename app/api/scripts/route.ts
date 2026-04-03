import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const scripts = await prisma.script.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true, imageUrl: true, category: true } } },
  })
  return NextResponse.json(scripts)
}
