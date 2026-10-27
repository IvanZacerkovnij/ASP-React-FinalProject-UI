import { describe, expect, it } from 'vitest'
import { escapeHtml, readAppIdentity } from '../identity'

describe('environment settings', () => {
  it('uses the documented identity defaults', () => {
    expect(readAppIdentity({})).toEqual({ name: 'Chirp', locale: 'uk-UA' })
  })

  it('trims identity settings and escapes interpolated HTML', () => {
    expect(readAppIdentity({ VITE_APP_NAME: ' Custom App ', VITE_APP_LOCALE: ' en-GB ' }))
      .toEqual({ name: 'Custom App', locale: 'en-GB' })
    expect(escapeHtml('<App & "name">')).toBe('&lt;App &amp; &quot;name&quot;&gt;')
  })
})
