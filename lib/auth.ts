import crypto from 'crypto'

function getSecret(): string {
  const secret = process.env.COOKIE_SECRET
  if (!secret) throw new Error('COOKIE_SECRET is not set')
  return secret
}

export function signValue(value: string): string {
  const sig = crypto.createHmac('sha256', getSecret()).update(value).digest('hex')
  return `${value}.${sig}`
}

export function unsignValue(signed: string): string | null {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.substring(0, lastDot)
  const sig = signed.substring(lastDot + 1)
  const expected = crypto.createHmac('sha256', getSecret()).update(value).digest('hex')
  if (sig.length !== expected.length) return null
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  return value
}

export function isValidSession(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false
  const cookies: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    cookies[part.substring(0, eqIdx).trim()] = part.substring(eqIdx + 1).trim()
  }
  const signed = cookies['admin_session']
  if (!signed) return false
  return unsignValue(decodeURIComponent(signed)) === 'authenticated'
}
