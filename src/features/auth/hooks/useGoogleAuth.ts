import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TransportSession } from '../../../shared/api/http-client'
import { GOOGLE_CLIENT_ID } from '../constants/auth'
import { AuthContext } from '../model/auth-context'
import { useAuth } from './useAuth'
import type { GoogleAuthMode } from '../types/auth'
import { APP_ROUTES } from '../../../shared/config/routes'

interface GoogleIdentity {
  initialize: (options: { client_id: string; ux_mode: 'popup'; callback: (response: { credential: string }) => void }) => void
  renderButton: (container: HTMLElement, options: {
    type: 'standard'; theme: 'outline'; size: 'large'; shape: 'pill' | 'rectangular';
    text: 'signin_with' | 'signup_with'; locale: string; width: number; click_listener: () => void
  }) => void
}

declare global {
  interface Window { google?: { accounts: { id: GoogleIdentity } } }
}

let loading: Promise<GoogleIdentity> | undefined

function loadIdentity() {
  if (window.google) return Promise.resolve(window.google.accounts.id)
  if (!loading) loading = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      if (window.google) resolve(window.google.accounts.id)
      else { loading = undefined; script.remove(); reject(new Error('Не вдалося завантажити Google.')) }
    }
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error('Не вдалося завантажити Google.')) }
    document.head.append(script)
  })
  return loading
}

export function useGoogleAuth({ mode, disabled, linked, onBusyChange, onLinked }: {
  mode: GoogleAuthMode; disabled?: boolean; linked?: boolean; onBusyChange?: (busy: boolean) => void; onLinked?: () => void
}) {
  const auth = useAuth()
  const context = useContext(AuthContext)!
  const navigate = useNavigate()
  const [isBusy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = useRef<AbortController | null>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const snapshot = useRef<TransportSession | null>(null)
  const submitting = useRef(false)
  const { loginWithGoogle, linkGoogle, isLoading, user } = auth
  const { session } = context

  useEffect(() => {
    const container = buttonRef.current
    const wrapper = container?.parentElement
    if (!GOOGLE_CLIENT_ID || !container || !wrapper || disabled || linked || isLoading) return
    const lifecycle = new AbortController()
    const resizeButton = () => {
      if (lifecycle.signal.aborted || container.parentElement !== wrapper) return
      const width = wrapper.clientWidth
      const height = wrapper.clientHeight
      if (width > 0 && height > 0) {
        container.style.transform = `scale(${width / 400}, ${height / 44})`
      }
    }
    resizeButton()
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resizeButton)
    resizeObserver?.observe(wrapper)
    const finish = (reason?: unknown) => {
      if (lifecycle.signal.aborted) return
      active.current = null
      submitting.current = false
      setBusy(false)
      onBusyChange?.(false)
      if (reason) setError(reason instanceof Error ? reason.message : 'Не вдалося увійти через Google.')
    }
    void loadIdentity().then(identity => {
      if (lifecycle.signal.aborted) return
      identity.initialize({ client_id: GOOGLE_CLIENT_ID, ux_mode: 'popup', callback: response => {
        const request = active.current
        const captured = snapshot.current
        if (!request || !captured || lifecycle.signal.aborted || submitting.current) return
        submitting.current = true
        setBusy(true)
        onBusyChange?.(true)
        void (async () => {
          request.signal.throwIfAborted()
          if (!session.transport.isCurrent(captured)) throw new DOMException('Сесію змінено.', 'AbortError')
          if (mode === 'link') await linkGoogle({ idToken: response.credential }, request.signal)
          else await loginWithGoogle({ idToken: response.credential }, request.signal)
          request.signal.throwIfAborted()
          finish()
          if (mode === 'link' && onLinked) onLinked()
          else if (mode === 'link') navigate(APP_ROUTES.SETTINGS, { replace: true, state: { googleLinkedUserId: user?.id } })
          else navigate(APP_ROUTES.HOME, { replace: true })
        })().then(() => finish(), finish)
      } })
      identity.renderButton(container, {
        type: 'standard', theme: 'outline', size: 'large', shape: mode === 'link' ? 'rectangular' : 'pill',
        text: mode === 'signup' ? 'signup_with' : 'signin_with', locale: 'uk', width: 400,
        click_listener: () => {
          active.current?.abort()
          active.current = new AbortController()
          submitting.current = false
          snapshot.current = session.transport.capture()
          setError(null)
        },
      })
    }).catch(finish)
    return () => {
      lifecycle.abort()
      resizeObserver?.disconnect()
      active.current?.abort()
      active.current = null
      container.replaceChildren()
    }
  }, [disabled, isLoading, linked, linkGoogle, loginWithGoogle, mode, navigate, onBusyChange, onLinked, session, user?.id])

  return { buttonRef, isBusy, error, isLoading }
}
