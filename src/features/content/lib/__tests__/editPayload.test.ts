import { describe, expect, it } from 'vitest'
import { buildEditPayload } from '../editPayload'

const poll = { options: [{ id: 'one', text: 'Так' }, { id: 'two', text: 'Ні' }], duration: 60 }
describe('edit commands', () => {
  it('omits unchanged polls so editing text does not reset voting or extend expiry', () => {
    const data = buildEditPayload({ content: 'Оновлено', mediaIds: [], poll: { options: ['Так', 'Ні'], duration: 60 } }, 'Текст', poll)
    expect(data.poll).toBeUndefined()
  })
  it('preserves explicit poll removal', () => {
    expect(buildEditPayload({ content: 'Текст', mediaIds: [], poll: null }, 'Текст', poll).poll).toBeNull()
  })
  it('does not silently preserve text that the user attempted to remove', () => {
    expect(() => buildEditPayload({ content: '', mediaIds: ['attachment'] }, 'Текст')).toThrow('видалення всього тексту')
  })
})
