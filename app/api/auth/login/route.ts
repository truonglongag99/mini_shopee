import { NextRequest, NextResponse } from 'next/server'
import { signValue } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  if (
    !username ||
    !password ||
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const signed = await signValue('authenticated')
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}
