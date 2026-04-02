import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidSession } from '@/lib/auth'

// GET: lấy 1 product theo id
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isValidSession(request.headers.get('cookie'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json().catch(() => ({}))

    const { name, imageUrl, price, affiliateUrl, category } = body

    if (!name || !imageUrl || price === undefined || !affiliateUrl || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: String(name),
        imageUrl: String(imageUrl),
        price: parseFloat(String(price)),
        affiliateUrl: String(affiliateUrl),
        category: String(category),
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: xoá product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isValidSession(request.headers.get('cookie'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}