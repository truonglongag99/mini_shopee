import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, slug, keywords } = await request.json().catch(() => ({}))
  if (!name || !slug || !keywords)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing)
    return NextResponse.json({ error: 'Slug đã tồn tại' }, { status: 400 })

  const category = await prisma.category.create({ data: { name, slug, keywords } })
  return NextResponse.json(category, { status: 201 })
}
