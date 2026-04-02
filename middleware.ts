import { NextRequest, NextResponse } from 'next/server'
import { isValidSession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const cookieHeader = request.headers.get('cookie')
  if (!(await isValidSession(cookieHeader))) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
