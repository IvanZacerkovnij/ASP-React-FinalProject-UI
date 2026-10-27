// @vitest-environment happy-dom
import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutosizeTextarea } from '../useAutosizeTextarea'
import { useBodyScrollLock } from '../useBodyScrollLock'
import { useClickOrDrag } from '../useClickOrDrag'
import { useDebouncedValue } from '../useDebouncedValue'
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard'

let root: Root
let host: HTMLDivElement

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('shared browser hooks', () => {
  it('debounces changes, cancels superseded timers and cleans up on unmount', async () => {
    vi.useFakeTimers()
    function Value({ value }: { value: string }) {
      return <span>{useDebouncedValue(value, 100, 'initial')}</span>
    }
    await act(async () => root.render(<Value value="first" />))
    expect(host.textContent).toBe('initial')
    await act(async () => vi.advanceTimersByTime(50))
    await act(async () => root.render(<Value value="second" />))
    await act(async () => vi.advanceTimersByTime(99))
    expect(host.textContent).toBe('initial')
    await act(async () => vi.advanceTimersByTime(1))
    expect(host.textContent).toBe('second')
    await act(async () => root.render(<Value value="pending" />))
    await act(async () => root.render(null))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps body scroll locked until the last mounted consumer releases it', async () => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'scroll'
    function Lock() {
      useBodyScrollLock(true)
      return null
    }
    try {
      await act(async () => root.render(<><Lock key="parent" /><Lock key="child" /></>))
      expect(document.body.style.overflow).toBe('hidden')
      await act(async () => root.render(<Lock key="child" />))
      expect(document.body.style.overflow).toBe('hidden')
      await act(async () => root.render(null))
      expect(document.body.style.overflow).toBe('scroll')
    } finally {
      document.body.style.overflow = previous
    }
  })

  it('guards unsaved changes, honors busy state, and removes the Escape listener', async () => {
    const close = vi.fn()
    function Guard({ busy = false }: { busy?: boolean }) {
      const guard = useUnsavedChangesGuard({ hasChanges: true, isBusy: busy, onClose: close })
      return <>
        <span>{String(guard.isConfirmOpen)}</span>
        <button onClick={guard.cancelDiscard}>Cancel</button>
        <button onClick={guard.confirmDiscard}>Discard</button>
      </>
    }
    const escape = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await act(async () => root.render(<Guard busy />))
    await act(async () => { escape() })
    expect(host.querySelector('span')?.textContent).toBe('false')
    await act(async () => root.render(<Guard />))
    await act(async () => { escape() })
    expect(host.querySelector('span')?.textContent).toBe('true')
    expect(close).not.toHaveBeenCalled()
    await act(async () => host.querySelectorAll('button')[0].click())
    expect(host.querySelector('span')?.textContent).toBe('false')
    await act(async () => { escape() })
    await act(async () => host.querySelectorAll('button')[1].click())
    expect(close).toHaveBeenCalledOnce()
    await act(async () => root.render(null))
    escape()
    expect(close).toHaveBeenCalledOnce()
  })

  it('ignores interactive children and drags while accepting a normal click', async () => {
    const action = vi.fn()
    function Surface() {
      const handlers = useClickOrDrag(action)
      return <div {...handlers}><span>Surface</span><button>Child</button></div>
    }
    await act(async () => root.render(<Surface />))
    const surface = host.querySelector('span')!
    await act(async () => host.querySelector('button')!.click())
    expect(action).not.toHaveBeenCalled()
    await act(async () => {
      surface.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 0, bubbles: true }))
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 20 }))
      window.dispatchEvent(new PointerEvent('pointerup'))
      surface.click()
    })
    expect(action).not.toHaveBeenCalled()
    await act(async () => surface.click())
    expect(action).toHaveBeenCalledOnce()
  })

  it('caps textarea height and cancels a queued animation on unmount', async () => {
    const ref = createRef<HTMLTextAreaElement>()
    let frame: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frame = callback; return 42 }))
    const cancel = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancel)
    function Textarea({ value }: { value: string }) {
      useAutosizeTextarea(ref, value, 2)
      return <textarea ref={ref} style={{ lineHeight: '20px', padding: '4px', maxHeight: '100px' }} />
    }
    await act(async () => root.render(<Textarea value="first" />))
    Object.defineProperty(ref.current, 'scrollHeight', { configurable: true, value: 150 })
    await act(async () => root.render(<Textarea value="second" />))
    frame!(0)
    expect(ref.current!.style.height).toBe('100px')
    expect(ref.current!.style.overflowY).toBe('auto')
    await act(async () => root.render(null))
    expect(cancel).toHaveBeenCalledWith(42)
  })
})
