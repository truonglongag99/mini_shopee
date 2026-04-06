import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  await prisma.product.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  })
  return NextResponse.json({ ok: true })
}
