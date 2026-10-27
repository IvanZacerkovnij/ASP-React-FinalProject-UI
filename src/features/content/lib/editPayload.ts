import type { ComposerSubmitData } from '../types/composer'
import type { ComposerPoll } from '../types/poll'

export function buildEditPayload(data: ComposerSubmitData, initialContent: string, initialPoll?: ComposerPoll | null): ComposerSubmitData {
  if (initialContent.trim() && !data.content.trim()) {
    throw new Error('Сервер не підтримує видалення всього тексту під час редагування. Зміни залишилися в редакторі.')
  }
  const initial = initialPoll ? { options: initialPoll.options.map(option => option.text.trim()).filter(Boolean), duration: initialPoll.duration } : null
  const unchanged = JSON.stringify(data.poll ?? null) === JSON.stringify(initial)
  return { ...data, ...(unchanged ? { poll: undefined } : {}) }
}
