// @vitest-environment happy-dom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import CodeInput from '../components/CodeInput'

let root: Root
let host: HTMLDivElement

function Controlled() {
  const [value, setValue] = useState('')
  return <><CodeInput value={value} onChange={setValue} /><output>{value}</output></>
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('preserves leading zeroes on paste and focuses the final digit', async () => {
  await act(async () => root.render(<Controlled />))
  const inputs = host.querySelectorAll('input')
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => '01 23a45' } })
  await act(async () => { inputs[0].dispatchEvent(event) })
  expect(host.querySelector('output')!.textContent).toBe('012345')
  expect(document.activeElement).toBe(inputs[5])
  expect(inputs[0].getAttribute('aria-label')).toBe('Цифра 1')
})

it('supports arrow navigation and backspace across controlled digits', async () => {
  const onChange = vi.fn()
  await act(async () => root.render(<CodeInput value="012" onChange={onChange} />))
  const inputs = host.querySelectorAll('input')
  await act(async () => { inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })) })
  expect(document.activeElement).toBe(inputs[1])
  await act(async () => { inputs[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true })) })
  expect(onChange).toHaveBeenLastCalledWith('01')
  expect(document.activeElement).toBe(inputs[2])
})

it('disables all verification inputs during submission', async () => {
  await act(async () => root.render(<CodeInput value="" onChange={vi.fn()} disabled />))
  expect([...host.querySelectorAll('input')].every(input => input.disabled)).toBe(true)
})
