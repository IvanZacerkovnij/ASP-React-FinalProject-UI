# Authentication migration — Batch 2

## Scope

Authentication only. The source checkout and backend remain unchanged. No Redux
Toolkit or RTK Query was added. Existing target dependency version specifications
are unchanged. React Hook Form 7.83.0, @hookform/resolvers 5.5.7, and Zod 4.4.3
are added at fixed source-declared versions. No environment files were inspected
or edited to configure authentication.

## Migration inventory

Source paths are relative to TwitterClone-main-2/src. Destination paths are
relative to the target src directory. Source files are retained.

| Source | Destination | Action |
| --- | --- | --- |
| components/auth/CodeInput.tsx | features/auth/components/CodeInput.tsx | Transfer controlled behavior, Ukrainian labels, responsive styling |
| components/auth/AuthShell.tsx | features/auth/components/AuthShell.tsx | Transfer layout, reuse route-neutral shared AppLogo, show session errors |
| components/auth/GoogleAuthButton.tsx | features/auth/components/GoogleAuthButton.tsx | Adapt to native Google popup button and preserve surrounding messages |
| components/auth/AccountConnections.tsx | features/auth/components/AccountConnections.tsx | Transfer linking UI and support popup success without reload |
| hooks/useAuth.ts | features/auth/hooks/useAuth.ts | Replace Redux integration with session commands and query-owned user |
| hooks/useGoogleAuth.ts | features/auth/hooks/useGoogleAuth.ts | Replace redirect flow with supported Google Identity Services callback |
| hooks/useGoogleCallback.ts, utils/googleRedirect.ts | Not transferred | Obsolete redirect protocol is not required by the current backend |
| schemas/auth.schema.ts | features/auth/schemas/auth.schema.ts | Preserve Ukrainian form schemas; align backend boundaries |
| types/auth.ts | features/auth/types/auth.ts | Preserve current DTOs; remove obsolete redirect and token-only refresh contracts |
| constants/auth.ts and auth limits from constants/app.ts | features/auth/constants/auth.ts | Transfer relevant constants only |
| store/auth.ts, store/session.ts, utils/storage.ts | features/auth/model/session.ts and auth-context.ts | Adapt lifecycle without Redux; persist one token pair |
| api/auth.api.ts | features/auth/api/auth.api.ts | Use existing HTTP client and actual ASP.NET Core endpoints |
| providers/AppEffects.tsx authentication effects | features/auth/components/AuthProvider.tsx | One bootstrap, transport binding, storage listener, query-owned /me |
| components/routeGuards/* | features/auth/components/GuestRoute.tsx and ProtectedRoute.tsx | Preserve loading and redirects without Redux |
| pages/auth/LoginPage.tsx, RegisterPage.tsx, VerifyEmailPage.tsx | pages/auth/ | Transfer forms and adapt auth commands/imports |
| pages/auth/ForgotPasswordPage.tsx, VerifyResetCodePage.tsx, ResetPasswordPage.tsx | pages/auth/ | Transfer recovery and password-change workflows |
| pages/landing/LandingPage.tsx | pages/auth/LandingPage.tsx | Transfer responsive landing/demo UI |
| ui/AppLogo.tsx | shared/ui/AppLogo.tsx | Transfer with route-neutral destination prop |
| layout footer presentation | widgets/auth-footer/AuthFooter.tsx | Retain landing footer presentation |
| schemas/__tests__/auth.schema.test.ts | features/auth/__tests__/auth.schema.test.ts | Transfer assertions and add current backend limits |

Additional target files: session types, auth public entry, AccountSecurityPage,
auth route constants, session/transport/API/route/Google/CodeInput regression tests.
Application providers, router, layout, shared HTTP transport/error normalization,
README files, package manifest, and lockfile are adapted for this batch.

## Verified contract

The local backend is ../CSharp-projects/Task/BackEndForFinalProject. Its README,
AuthController, Auth request DTOs/AuthResponse, UserResponse, SessionService, and
RefreshTokenManager were inspected. This is source verification, not a live
OpenAPI/server test.

- `VITE_PATH_TO_SERVER` and `VITE_PATH_TO_API` form the API base URL, including `/api`. Adapters append `/auth/...` and `/me`.
- Login and Google login return full AuthResponse, including required
  accessTokenExpiresAt. Refresh returns the same full response and rotates tokens.
- Registration returns a message. Email verification establishes authentication.
- Refresh and logout send JSON `{ refreshToken }`; logout succeeds with 204.
  An already invalidated token can return 401; local logout remains complete.
- Password change uses `/me/change-password/start` and `/me/change-password/confirm`.
- Recovery sends `newPassword`, not the form-only password/confirmation fields.
- Register usernames allow 1–50 ASCII letters/digits/dots/underscores. Passwords
  are 8–64 characters, email/identity limits are 255, display names at most 100,
  and verification codes contain six digits. The existing required display-name
  form UX is preserved, although the server permits omission.
- Google login/link receives `{ idToken }`, not an authorization code or Google
  access token. The hosted GIS button uses popup callbacks and Ukrainian locale.

## Storage and session lifecycle

Credentials live in a versioned `chirp.auth.session.v1` browser-storage record.
Tokens are outside React Query data/keys and user context data; only the session
controller accesses the token pair. User data is fetched by a session-scoped
`['auth', sessionId, 'me']` query, separate from form and interaction state.

Web Locks enable localStorage persistence and serialize refresh/revocation across
tabs. A waiting tab rereads storage under the lock and reuses a rotated token.
Without Web Locks, sessionStorage isolates persistence to the tab and a shared
promise coordinates its requests. This fallback survives reloads but does not
provide browser-restart persistence or cross-tab session synchronization.

At startup, expired credentials refresh before /me is fetched. Guards display a
loading indicator until restoration finishes. /me must identify the token's user.
Successful login/verification establishes a new session and discards the old cache.
Registration alone never establishes authentication.

Only authenticated 401 responses trigger refresh. Public auth endpoints and 403
responses never trigger it. Requests retry at most once. A delayed old-token 401
reuses the already rotated pair. Individual cancellation does not abort a refresh
needed by other requests. Refresh failure ends the local session without a retry
loop; transient failures deliberately require signing in again. Session errors
are displayed by the authentication shell.

Every protected response is checked against its captured session before returning
data. Authentication attempts have an additional sequence check. Old refresh,
login, or Google completions cannot replace a later session. Discarded issued
tokens are revoked on a best-effort basis. Logout clears local state immediately;
a refresh completing afterward can only supply tokens to revocation cleanup.
Logout/revocation failure does not restore local authentication and is reported.

Logout, account changes, and terminal authentication failures cancel queries and
clear the QueryClient, including mutation records. This intentionally clears
public cached data too: future public responses can contain viewer-specific fields.
Future feature mutations must also guard asynchronous cache writes/rollback with
the captured session identity; clearing cache alone cannot cancel arbitrary work.

The existing HTTP client now accepts an injected auth adapter. Shared modules do
not import features. ProblemDetails payloads, status, validation fields, and
Retry-After are retained; detail/title produce the user-facing error. Empty, text,
JSON, multipart, and abort behavior remain supported. No optimistic server-data
operation is introduced by this auth batch.

## Verification

The pre-change target baseline passed lint, build, and 50 tests in 12 files.
Added coverage includes schemas, CodeInput paste/keyboard behavior, actual API
request formats, refresh single-flight, cross-tab lock serialization, stale login
and refresh completion, session replacement, failed revocation, storage failure,
private cache cleanup, cancellation, ProblemDetails, retry limits, StrictMode
restoration, route guards, and Google credential/link callbacks.

| Final check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run test` | 93 passed, 18 test files |
| Authentication subset | 43 passed, 6 test files |
| `git diff --check` | Passed |
| Static import graph | 94 TypeScript files; no upward imports, unresolved local imports, or runtime import cycles |

## Limits and next steps

No live backend, Google account, or browser automation was used. Real provider
configuration, delivered email codes, mobile/desktop rendering, and native
cross-tab Web Locks still need browser integration checks; tests use a lock stub.
Mock source fixtures were not imported as an alternative runtime backend. Auth
tests mock the HTTP boundary instead.

The remaining migration now activates home, information pages, profiles, posts,
and administration. See [the integration report](../../../docs/migration/remaining-migration.md)
for current verification. Profile updates use the existing session to update
the current user's query record, guarded against account switching. Public
session guards also protect content reactions and moderation task sequences.
The earlier verification table records the authentication batch's historical
baseline; it is superseded by the integration report's totals.
