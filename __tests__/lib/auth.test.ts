process.env.COOKIE_SECRET = 'test-secret-32-chars-long-minimum!!'

import { signValue, unsignValue, isValidSession } from '@/lib/auth'

describe('signValue', () => {
  it('returns a string with a dot separator', async () => {
    const signed = await signValue('hello')
    expect(signed).toContain('.')
    expect(signed.startsWith('hello.')).toBe(true)
  })
})

describe('unsignValue', () => {
  it('returns original value for a correctly signed string', async () => {
    const signed = await signValue('authenticated')
    expect(await unsignValue(signed)).toBe('authenticated')
  })

  it('returns null for a tampered signature', async () => {
    const signed = await signValue('authenticated')
    const tampered = signed.slice(0, -3) + 'xxx'
    expect(await unsignValue(tampered)).toBeNull()
  })

  it('returns null for a string with no dot', async () => {
    expect(await unsignValue('noseparator')).toBeNull()
  })

  it('returns null for an empty string', async () => {
    expect(await unsignValue('')).toBeNull()
  })
})

describe('isValidSession', () => {
  it('returns true for a valid admin_session cookie', async () => {
    const signed = await signValue('authenticated')
    expect(await isValidSession(`admin_session=${encodeURIComponent(signed)}`)).toBe(true)
  })

  it('returns false when cookie header is null', async () => {
    expect(await isValidSession(null)).toBe(false)
  })

  it('returns false when admin_session cookie is missing', async () => {
    expect(await isValidSession('other_cookie=value')).toBe(false)
  })

  it('returns false when admin_session cookie has invalid signature', async () => {
    expect(await isValidSession('admin_session=tampered.badhash')).toBe(false)
  })
})
