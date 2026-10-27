import { useMemo, useState } from 'react'
import { emojiCatalog } from './catalog'

const TONES = ['', '🏻', '🏼', '🏽', '🏾', '🏿']
export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(0)
  const [tone, setTone] = useState('')
  const [limit, setLimit] = useState(140)
  const emojis = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('uk')
    return search ? emojiCatalog.flatMap(group => group.emojis).filter(item =>
      item.keywords.toLocaleLowerCase('uk').includes(search) || item.emoji.includes(search),
    ) : emojiCatalog[category].emojis
  }, [query, category])
  return <section aria-label="Вибрати емодзі" className="max-h-96 w-72 overflow-y-auto rounded-xl bg-background p-3 sm:w-80">
    <label className="text-sm">Пошук емодзі
      <input value={query} onChange={event => { setQuery(event.target.value); setLimit(140) }} className="my-2 w-full rounded border border-border bg-background p-2" />
    </label>
    <div className="mb-3 flex gap-2">
      <label className="min-w-0 flex-1 text-xs">Категорія
        <select value={category} onChange={event => { setCategory(Number(event.target.value)); setQuery(''); setLimit(140) }} className="mt-1 w-full rounded border border-border bg-background p-1">
          {emojiCatalog.map((group, index) => <option value={index} key={group.name}>{group.name}</option>)}
        </select>
      </label>
      <label className="text-xs">Відтінок
        <select value={tone} onChange={event => setTone(event.target.value)} className="mt-1 block rounded border border-border bg-background p-1">
          {TONES.map((value, index) => <option key={value} value={value}>{index === 0 ? 'Стандартний' : value}</option>)}
        </select>
      </label>
    </div>
    <div className="grid grid-cols-7 gap-1">{emojis.slice(0, limit).map(item => {
      const emoji = tone ? item.variants.find(variant => variant.includes(tone)) ?? item.emoji : item.emoji
      return <button type="button" key={item.emoji} title={item.name} aria-label={item.name} className="rounded p-1 text-xl hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onSelect(emoji)}>{emoji}</button>
    })}</div>
    {emojis.length === 0 && <p role="status" className="p-3 text-sm">Емодзі не знайдено</p>}
    {emojis.length > limit && <button type="button" className="mt-3 w-full rounded border border-border p-2 text-sm" onClick={() => setLimit(value => value + 140)}>Показати більше</button>}
  </section>
}
