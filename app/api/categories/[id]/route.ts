import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
