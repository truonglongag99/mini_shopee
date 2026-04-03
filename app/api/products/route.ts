import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  if (!(await isValidSession(request.headers.get('cookie'))))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const { name, imageUrl, price, affiliateUrl, category, description, isVisible } = body
  if (!name || !imageUrl || price === undefined || !affiliateUrl || !category)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const product = await prisma.product.create({
    data: { name: String(name), imageUrl: String(imageUrl), price: parseFloat(String(price)), affiliateUrl: String(affiliateUrl), category: String(category), description: description ? String(description) : null, isVisible: isVisible !== undefined ? Boolean(isVisible) : true },
  })
  return NextResponse.json(product, { status: 201 })
}
