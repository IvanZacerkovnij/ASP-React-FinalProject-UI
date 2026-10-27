import { useCallback, useSyncExternalStore } from 'react'
import type { Theme } from '../../../shared/types/theme'

const KEY = 'chirp.theme'
const listeners = new Set<() => void>()
let memory: Theme = 'system'
let unavailable = false
const read = (): Theme => {
  if (unavailable) return memory
  try {
    const value = localStorage.getItem(KEY) ?? localStorage.getItem('tc_theme')
    return value === 'dark' || value === 'light' ? value : 'system'
  } catch { return memory }
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const systemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
export function applyTheme() {
  const theme = read()
  document.documentElement.dataset.theme = theme === 'system' ? systemTheme() : theme
}
export function watchTheme() {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const update = () => { applyTheme(); listeners.forEach(listener => listener()) }
  update()
  media.addEventListener('change', update)
  window.addEventListener('storage', update)
  return () => { media.removeEventListener('change', update); window.removeEventListener('storage', update) }
}
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'system' as const)
  const setTheme = useCallback((value: Theme) => {
    memory = value
    try { localStorage.setItem(KEY, value) } catch { unavailable = true }
    applyTheme()
    listeners.forEach(listener => listener())
  }, [])
  const toggleTheme = useCallback(() => setTheme((theme === 'system' ? systemTheme() : theme) === 'dark' ? 'light' : 'dark'), [theme, setTheme])
  return { theme, setTheme, toggleTheme }
}
