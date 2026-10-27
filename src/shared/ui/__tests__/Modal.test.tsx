// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Modal } from '../Modal'

let root: Root
let host: HTMLDivElement
const close = vi.fn()

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  close.mockClear()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('labels the dialog, locks scrolling, and dismisses with Escape', async () => {
  const overflow = document.body.style.overflow
  await act(async () => root.render(<Modal open title="Підтвердження" onClose={close}><input aria-label="Текст" /></Modal>))
  const dialog = document.querySelector('[role="dialog"]')!
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('Підтвердження')
  expect(document.body.style.overflow).toBe('hidden')
  await act(async () => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  expect(close).toHaveBeenCalledOnce()
  await act(async () => root.render(null))
  expect(document.body.style.overflow).toBe(overflow)
  expect(document.querySelector('[role="dialog"]')).toBeNull()
})

it('blocks Escape and close-button dismissal while busy', async () => {
  await act(async () => root.render(<Modal open busy title="Збереження" onClose={close}>Зачекайте</Modal>))
  const dialog = document.querySelector('[role="dialog"]')!
  expect(dialog.getAttribute('aria-busy')).toBe('true')
  const button = dialog.querySelector('button')!
  expect(button.disabled).toBe(true)
  await act(async () => {
    button.click()
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  expect(close).not.toHaveBeenCalled()
})
