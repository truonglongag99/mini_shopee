process.env.COOKIE_SECRET = 'test-secret-32-chars-long-minimum!!'

import { signValue, unsignValue, isValidSession } from '@/lib/auth'

describe('signValue', () => {
  it('returns a string with a dot separator', () => {
    const signed = signValue('hello')
    expect(signed).toContain('.')
    expect(signed.startsWith('hello.')).toBe(true)
  })
})

describe('unsignValue', () => {
  it('returns original value for a correctly signed string', () => {
    const signed = signValue('authenticated')
    expect(unsignValue(signed)).toBe('authenticated')
  })

  it('returns null for a tampered signature', () => {
    const signed = signValue('authenticated')
    const tampered = signed.slice(0, -3) + 'xxx'
    expect(unsignValue(tampered)).toBeNull()
  })

  it('returns null for a string with no dot', () => {
    expect(unsignValue('noseparator')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(unsignValue('')).toBeNull()
  })
})

describe('isValidSession', () => {
  it('returns true for a valid admin_session cookie', () => {
    const signed = signValue('authenticated')
    expect(isValidSession(`admin_session=${encodeURIComponent(signed)}`)).toBe(true)
  })

  it('returns false when cookie header is null', () => {
    expect(isValidSession(null)).toBe(false)
  })

  it('returns false when admin_session cookie is missing', () => {
    expect(isValidSession('other_cookie=value')).toBe(false)
  })

  it('returns false when admin_session cookie has invalid signature', () => {
    expect(isValidSession('admin_session=tampered.badhash')).toBe(false)
  })
})
