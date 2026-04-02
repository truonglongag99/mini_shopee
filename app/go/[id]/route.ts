import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const product = await prisma.product.findUnique({
      where: { id },
      select: { affiliateUrl: true },
    })

    if (!product) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    waitUntil(
      prisma.product.update({
        where: { id },
        data: { clickCount: { increment: 1 } },
      })
    )

    return NextResponse.redirect(product.affiliateUrl, { status: 302 })
  } catch (error) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}