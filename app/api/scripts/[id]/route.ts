import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  const { status } = await request.json().catch(() => ({}))

  if (!['draft', 'approved', 'rejected'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const script = await prisma.script.update({ where: { id }, data: { status } })
  return NextResponse.json(script)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await context.params
  await prisma.script.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
