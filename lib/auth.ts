function getSecret(): string {
  const secret = process.env.COOKIE_SECRET
  if (!secret) throw new Error('COOKIE_SECRET is not set')
  return secret
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function hmacHex(value: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret)
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function signValue(value: string): Promise<string> {
  const sig = await hmacHex(value, getSecret())
  return `${value}.${sig}`
}

export async function unsignValue(signed: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf('.')
  if (lastDot === -1) return null
  const value = signed.substring(0, lastDot)
  const sig = signed.substring(lastDot + 1)
  const expected = await hmacHex(value, getSecret())
  if (sig !== expected) return null
  return value
}

export async function isValidSession(cookieHeader: string | null): Promise<boolean> {
  if (!cookieHeader) return false
  const cookies: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    cookies[part.substring(0, eqIdx).trim()] = part.substring(eqIdx + 1).trim()
  }
  const signed = cookies['admin_session']
  if (!signed) return false
  return (await unsignValue(decodeURIComponent(signed))) === 'authenticated'
}
