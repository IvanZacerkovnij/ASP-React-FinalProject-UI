// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { imageCache } from '../../lib/image-cache'
import { useImageCache } from '../useImageCache'

vi.mock('../../lib/image-cache', () => ({ imageCache: { fetchAndCache: vi.fn() } }))

let root: Root
let host: HTMLDivElement

function Image({ url }: { url: string }) {
  const image = useImageCache(url)
  return <span data-loading={image.isLoading}>{image.src}</span>
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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('ignores stale downloads and releases only its owned object URL', async () => {
  let finishFirst!: (blob: Blob) => void
  vi.mocked(imageCache.fetchAndCache)
    .mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve }))
    .mockResolvedValueOnce(new Blob(['second']))
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:owned')
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  await act(async () => root.render(<Image url="/first.png" />))
  expect(host.querySelector('span')?.dataset.loading).toBe('true')
  await act(async () => root.render(<Image url="/second.png" />))
  expect(host.textContent).toBe('blob:owned')
  await act(async () => { finishFirst(new Blob(['stale'])) })
  expect(create).toHaveBeenCalledOnce()
  expect(host.textContent).toBe('blob:owned')
  await act(async () => root.render(<Image url="data:image/png;base64,example" />))
  expect(revoke).toHaveBeenCalledExactlyOnceWith('blob:owned')
  expect(host.textContent).toBe('data:image/png;base64,example')
})

it('falls back to the original URL when fetching fails', async () => {
  vi.mocked(imageCache.fetchAndCache).mockResolvedValueOnce(null)
  await act(async () => root.render(<Image url="/offline.png" />))
  expect(host.textContent).toBe('/offline.png')
  expect(host.querySelector('span')?.dataset.loading).toBe('false')
})

it('does not allocate object URLs for downloads completed after unmount', async () => {
  let finish!: (blob: Blob) => void
  vi.mocked(imageCache.fetchAndCache).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  const create = vi.spyOn(URL, 'createObjectURL')
  await act(async () => root.render(<Image url="/pending.png" />))
  await act(async () => root.render(null))
  await act(async () => { finish(new Blob(['late'])) })
  expect(create).not.toHaveBeenCalled()
})
